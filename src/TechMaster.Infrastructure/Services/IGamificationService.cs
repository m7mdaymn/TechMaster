using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Enrollment;
using TechMaster.Application.DTOs.Gamification;
using TechMaster.Domain.Enums;

namespace TechMaster.Infrastructure.Services;

public interface IGamificationService
{
    Task<Result> AwardXpAsync(Guid userId, int points, string reason);
    Task<Result> CheckAndAwardBadgesAsync(Guid userId);
    Task<Result<List<BadgeDto>>> GetUserBadgesAsync(Guid userId);
    Task<Result<List<BadgeDto>>> GetAvailableBadgesAsync();
    Task<Result> CreateBadgeAsync(string nameEn, string nameAr, BadgeType type, string iconUrl, int xpReward, string? criteria = null);
    Task<Result<LeaderboardDto>> GetLeaderboardAsync(int count = 100, string period = "all");
    Task<Result<UserRankDto>> GetUserRankAsync(Guid userId);
}
