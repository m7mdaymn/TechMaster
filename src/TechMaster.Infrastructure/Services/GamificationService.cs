using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Enrollment;
using TechMaster.Domain.Entities;
using TechMaster.Domain.Enums;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class GamificationService : IGamificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public GamificationService(ApplicationDbContext context, IMapper mapper, INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    public async Task<Result> AwardXpAsync(Guid userId, int points, string reason)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found", "المستخدم غير موجود");
        }

        user.XpPoints += points;
        await _context.SaveChangesAsync();

        return Result.Success($"Awarded {points} XP", $"تم منح {points} نقطة");
    }

    public async Task<Result> CheckAndAwardBadgesAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.Badges)
            .Include(u => u.Enrollments)
            .Include(u => u.QuizAttempts)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return Result.Failure("User not found", "المستخدم غير موجود");
        }

        var allBadges = await _context.Badges.Where(b => b.IsActive).ToListAsync();
        var userBadgeIds = user.Badges.Select(ub => ub.BadgeId).ToHashSet();

        foreach (var badge in allBadges)
        {
            if (userBadgeIds.Contains(badge.Id)) continue;

            bool shouldAward = badge.Type switch
            {
                BadgeType.CourseCompletion => user.Enrollments.Count(e => e.Status == EnrollmentStatus.Completed) >= 1,
                BadgeType.QuizMaster => user.QuizAttempts.Count(a => a.IsPassed) >= 10,
                BadgeType.FastLearner => user.Enrollments.Any(e => 
                    e.Status == EnrollmentStatus.Completed && 
                    e.CompletedAt.HasValue &&
                    (e.CompletedAt.Value - e.CreatedAt).TotalDays <= 7),
                BadgeType.Consistent => user.Enrollments.Count(e => e.Status == EnrollmentStatus.Completed) >= 3,
                BadgeType.TopPerformer => user.QuizAttempts.Any(a => a.IsPassed && a.Score * 100.0 / a.TotalPoints >= 95),
                _ => false
            };

            if (shouldAward)
            {
                var userBadge = new UserBadge
                {
                    UserId = userId,
                    BadgeId = badge.Id,
                    EarnedAt = DateTime.UtcNow,
                    EarnedFor = badge.Type.ToString()
                };

                _context.UserBadges.Add(userBadge);
                user.XpPoints += badge.XpReward;

                await _notificationService.CreateNotificationAsync(new Application.DTOs.Notification.CreateNotificationDto
                {
                    UserId = userId,
                    TitleEn = "New Badge Earned!",
                    TitleAr = "تم الحصول على شارة جديدة!",
                    MessageEn = $"Congratulations! You earned the '{badge.NameEn}' badge!",
                    MessageAr = $"تهانينا! لقد حصلت على شارة '{badge.NameAr}'!",
                    Type = NotificationType.BadgeEarned,
                    ActionUrl = "/dashboard/achievements"
                });
            }
        }

        await _context.SaveChangesAsync();
        return Result.Success("Badges checked", "تم التحقق من الشارات");
    }

    public async Task<Result<List<BadgeDto>>> GetUserBadgesAsync(Guid userId)
    {
        var userBadges = await _context.UserBadges
            .Include(ub => ub.Badge)
            .Where(ub => ub.UserId == userId)
            .OrderByDescending(ub => ub.EarnedAt)
            .ToListAsync();

        return Result<List<BadgeDto>>.Success(_mapper.Map<List<BadgeDto>>(userBadges));
    }

    public async Task<Result<List<BadgeDto>>> GetAvailableBadgesAsync()
    {
        var badges = await _context.Badges
            .Where(b => b.IsActive)
            .ToListAsync();

        return Result<List<BadgeDto>>.Success(_mapper.Map<List<BadgeDto>>(badges));
    }

    public async Task<Result> CreateBadgeAsync(string nameEn, string nameAr, BadgeType type, string iconUrl, int xpReward, string? criteria = null)
    {
        var badge = new Badge
        {
            NameEn = nameEn,
            NameAr = nameAr,
            Type = type,
            IconUrl = iconUrl,
            XpReward = xpReward,
            Criteria = criteria,
            IsActive = true
        };

        _context.Badges.Add(badge);
        await _context.SaveChangesAsync();

        return Result.Success("Badge created", "تم إنشاء الشارة");
    }

    public async Task<Result<Application.DTOs.Gamification.LeaderboardDto>> GetLeaderboardAsync(int count = 100, string period = "all")
    {
        var query = _context.Users
            .Include(u => u.Badges)
            .Include(u => u.Enrollments)
            .Where(u => u.IsActive && u.Role == UserRole.Student);

        // Filter by period if specified
        if (period == "monthly")
        {
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            // For monthly, we still show all-time XP but could filter by activity
        }
        else if (period == "weekly")
        {
            var startOfWeek = DateTime.UtcNow.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
            // For weekly, we still show all-time XP but could filter by activity
        }

        var users = await query
            .OrderByDescending(u => u.XpPoints)
            .Take(count)
            .Select(u => new Application.DTOs.Gamification.LeaderboardEntryDto
            {
                UserId = u.Id,
                UserName = u.FirstName + " " + u.LastName,
                ProfileImageUrl = u.ProfileImageUrl,
                TotalXp = u.XpPoints,
                Level = u.XpPoints / 1000 + 1,
                BadgeCount = u.Badges.Count,
                CompletedCourses = u.Enrollments.Count(e => e.Status == EnrollmentStatus.Completed)
            })
            .ToListAsync();

        // Assign ranks
        for (int i = 0; i < users.Count; i++)
        {
            users[i].Rank = i + 1;
        }

        var totalParticipants = await _context.Users
            .Where(u => u.IsActive && u.Role == UserRole.Student)
            .CountAsync();

        return Result<Application.DTOs.Gamification.LeaderboardDto>.Success(new Application.DTOs.Gamification.LeaderboardDto
        {
            TopUsers = users,
            TotalParticipants = totalParticipants,
            Period = period,
            GeneratedAt = DateTime.UtcNow
        });
    }

    public async Task<Result<Application.DTOs.Gamification.UserRankDto>> GetUserRankAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result<Application.DTOs.Gamification.UserRankDto>.Failure("User not found", "المستخدم غير موجود");
        }

        var rank = await _context.Users
            .Where(u => u.IsActive && u.Role == UserRole.Student && u.XpPoints > user.XpPoints)
            .CountAsync() + 1;

        var totalParticipants = await _context.Users
            .Where(u => u.IsActive && u.Role == UserRole.Student)
            .CountAsync();

        // Get user above and below
        var nextUser = await _context.Users
            .Where(u => u.IsActive && u.Role == UserRole.Student && u.XpPoints > user.XpPoints)
            .OrderBy(u => u.XpPoints)
            .Select(u => new Application.DTOs.Gamification.LeaderboardEntryDto
            {
                UserId = u.Id,
                UserName = u.FirstName + " " + u.LastName,
                ProfileImageUrl = u.ProfileImageUrl,
                TotalXp = u.XpPoints,
                Level = u.XpPoints / 1000 + 1
            })
            .FirstOrDefaultAsync();

        var previousUser = await _context.Users
            .Where(u => u.IsActive && u.Role == UserRole.Student && u.XpPoints < user.XpPoints)
            .OrderByDescending(u => u.XpPoints)
            .Select(u => new Application.DTOs.Gamification.LeaderboardEntryDto
            {
                UserId = u.Id,
                UserName = u.FirstName + " " + u.LastName,
                ProfileImageUrl = u.ProfileImageUrl,
                TotalXp = u.XpPoints,
                Level = u.XpPoints / 1000 + 1
            })
            .FirstOrDefaultAsync();

        return Result<Application.DTOs.Gamification.UserRankDto>.Success(new Application.DTOs.Gamification.UserRankDto
        {
            Rank = rank,
            TotalXp = user.XpPoints,
            Level = user.XpPoints / 1000 + 1,
            TotalParticipants = totalParticipants,
            XpToNextRank = nextUser != null ? nextUser.TotalXp - user.XpPoints : 0,
            NextUser = nextUser,
            PreviousUser = previousUser
        });
    }
}
