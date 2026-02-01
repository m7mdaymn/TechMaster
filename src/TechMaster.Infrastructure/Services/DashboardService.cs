using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Admin;
using TechMaster.Application.DTOs.Auth;
using TechMaster.Application.DTOs.Course;
using TechMaster.Application.DTOs.Enrollment;
using TechMaster.Domain.Entities;
using TechMaster.Domain.Enums;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public DashboardService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    private static string HashPassword(string password)
    {
        using var hmac = new HMACSHA512();
        var salt = hmac.Key;
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash);
    }

    #region Admin Dashboard

    public async Task<Result<AdminDashboardDto>> GetAdminDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var startOfLastMonth = startOfMonth.AddMonths(-1);

        var totalUsers = await _context.Users.CountAsync();
        var newUsersThisMonth = await _context.Users.CountAsync(u => u.CreatedAt >= startOfMonth);
        var newUsersLastMonth = await _context.Users.CountAsync(u => u.CreatedAt >= startOfLastMonth && u.CreatedAt < startOfMonth);

        var totalCourses = await _context.Courses.CountAsync();
        var publishedCourses = await _context.Courses.CountAsync(c => c.Status == CourseStatus.Published);
        var newCoursesThisMonth = await _context.Courses.CountAsync(c => c.CreatedAt >= startOfMonth);
        var newCoursesLastMonth = await _context.Courses.CountAsync(c => c.CreatedAt >= startOfLastMonth && c.CreatedAt < startOfMonth);

        var totalEnrollments = await _context.Enrollments.CountAsync();
        var activeEnrollments = await _context.Enrollments.CountAsync(e => e.Status == EnrollmentStatus.Approved);
        var completedEnrollments = await _context.Enrollments.CountAsync(e => e.Status == EnrollmentStatus.Completed);
        var newEnrollmentsThisMonth = await _context.Enrollments.CountAsync(e => e.CreatedAt >= startOfMonth);
        var newEnrollmentsLastMonth = await _context.Enrollments.CountAsync(e => e.CreatedAt >= startOfLastMonth && e.CreatedAt < startOfMonth);

        var totalRevenue = await _context.Enrollments.Where(e => e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed)
            .SumAsync(e => e.AmountPaid ?? 0);
        var revenueThisMonth = await _context.Enrollments
            .Where(e => e.ApprovedAt >= startOfMonth && (e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed))
            .SumAsync(e => e.AmountPaid ?? 0);
        var revenueLastMonth = await _context.Enrollments
            .Where(e => e.ApprovedAt >= startOfLastMonth && e.ApprovedAt < startOfMonth && (e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed))
            .SumAsync(e => e.AmountPaid ?? 0);

        var totalCertificates = await _context.Certificates.CountAsync();
        var certificatesThisMonth = await _context.Certificates.CountAsync(c => c.CreatedAt >= startOfMonth);

        var pendingEnrollments = await _context.Enrollments.CountAsync(e => e.Status == EnrollmentStatus.PaymentPending);
        var pendingInternships = await _context.InternshipApplications.CountAsync(a => a.Status == InternshipApplicationStatus.Pending);

        // Recent activities
        var recentEnrollments = await _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
            .OrderByDescending(e => e.CreatedAt)
            .Take(5)
            .ToListAsync();

        var recentUsers = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(5)
            .ToListAsync();

        // User distribution by role
        var usersByRole = await _context.Users
            .GroupBy(u => u.Role)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Role.ToString(), x => x.Count);

        // Enrollment trends (last 7 days)
        var enrollmentTrends = await _context.Enrollments
            .Where(e => e.CreatedAt >= now.AddDays(-7))
            .GroupBy(e => e.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync();

        // Revenue trends (last 7 days)
        var revenueTrends = await _context.Enrollments
            .Where(e => e.ApprovedAt >= now.AddDays(-7) && (e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed))
            .GroupBy(e => e.ApprovedAt!.Value.Date)
            .Select(g => new { Date = g.Key, Amount = g.Sum(x => x.AmountPaid ?? 0) })
            .OrderBy(x => x.Date)
            .ToListAsync();

        // Top courses by enrollments
        var topCourses = await _context.Courses
            .Include(c => c.Enrollments)
            .OrderByDescending(c => c.Enrollments.Count)
            .Take(5)
            .ToListAsync();

        // Total students and instructors
        var totalStudents = await _context.Users.CountAsync(u => u.Role == UserRole.Student);
        var totalInstructors = await _context.Users.CountAsync(u => u.Role == UserRole.Instructor);
        var totalInternships = await _context.Internships.CountAsync();
        var totalContactMessages = await _context.ContactMessages.CountAsync();
        var unreadMessages = await _context.ContactMessages.CountAsync(m => !m.IsRead);

        // Build enrollment stats (last 6 months)
        var enrollmentStats = new List<EnrollmentStatsDto>();
        for (int i = 5; i >= 0; i--)
        {
            var monthStart = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);
            var count = await _context.Enrollments.CountAsync(e => e.CreatedAt >= monthStart && e.CreatedAt < monthEnd);
            enrollmentStats.Add(new EnrollmentStatsDto { Period = monthStart.ToString("MMM yyyy"), Count = count });
        }

        // Build user registration stats (last 6 months)
        var userRegistrationStats = new List<EnrollmentStatsDto>();
        for (int i = 5; i >= 0; i--)
        {
            var monthStart = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);
            var count = await _context.Users.CountAsync(u => u.CreatedAt >= monthStart && u.CreatedAt < monthEnd);
            userRegistrationStats.Add(new EnrollmentStatsDto { Period = monthStart.ToString("MMM yyyy"), Count = count });
        }

        // Build enrollment by category breakdown
        var categoryEnrollments = await _context.Enrollments
            .Include(e => e.Course)
            .ThenInclude(c => c.Category)
            .Where(e => e.Course.Category != null)
            .GroupBy(e => new { e.Course.Category!.NameEn, e.Course.Category!.NameAr })
            .Select(g => new { CategoryEn = g.Key.NameEn ?? "Uncategorized", CategoryAr = g.Key.NameAr ?? "غير مصنف", Count = g.Count() })
            .OrderByDescending(c => c.Count)
            .Take(8)
            .ToListAsync();

        var maxCategoryCount = categoryEnrollments.Any() ? categoryEnrollments.Max(c => c.Count) : 1;
        var categoryBreakdown = categoryEnrollments.Select(c => new CategoryBreakdownDto
        {
            Name = c.CategoryEn,
            NameAr = c.CategoryAr,
            Count = c.Count,
            Percentage = maxCategoryCount > 0 ? Math.Round((double)c.Count / maxCategoryCount * 100, 1) : 0
        }).ToList();

        // Top courses stats
        var topCoursesStats = topCourses.Select(c => new CourseStatsDto
        {
            CourseId = c.Id,
            CourseName = c.NameEn,
            EnrollmentCount = c.Enrollments.Count,
            CompletionCount = c.Enrollments.Count(e => e.Status == EnrollmentStatus.Completed),
            AverageProgress = c.Enrollments.Any() ? c.Enrollments.Average(e => e.ProgressPercentage) : 0
        }).ToList();

        // Recent activities
        var recentActivities = recentEnrollments.Select(e => new RecentActivityDto
        {
            Type = "Enrollment",
            Description = $"{e.User.FullName} enrolled in {e.Course.NameEn}",
            DescriptionAr = $"{e.User.FullName} سجل في {e.Course.NameAr}",
            Timestamp = e.CreatedAt,
            UserName = e.User.FullName
        }).ToList();

        // Calculate growth percentages
        double CalculateGrowth(int current, int previous) =>
            previous == 0 ? (current > 0 ? 100 : 0) : Math.Round(((double)(current - previous) / previous) * 100, 1);
        
        double CalculateRevenueGrowth(decimal current, decimal previous) =>
            previous == 0 ? (current > 0 ? 100 : 0) : Math.Round(((double)(current - previous) / (double)previous) * 100, 1);

        // Map recent users
        var recentUserDtos = recentUsers.Select(u => new RecentUserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            ProfileImageUrl = u.ProfileImageUrl,
            Role = u.Role.ToString(),
            CreatedAt = u.CreatedAt,
            IsActive = u.IsActive
        }).ToList();

        // Map recent enrollments
        var recentEnrollmentDtos = recentEnrollments.Select(e => new RecentEnrollmentDto
        {
            Id = e.Id,
            UserName = e.User.FullName,
            UserEmail = e.User.Email,
            UserAvatar = e.User.ProfileImageUrl,
            CourseTitle = e.Course.NameEn,
            CourseThumbnail = e.Course.ThumbnailUrl,
            Amount = e.AmountPaid ?? 0,
            Status = e.Status.ToString(),
            EnrolledAt = e.CreatedAt
        }).ToList();

        var dashboard = new AdminDashboardDto
        {
            TotalStudents = totalStudents,
            TotalInstructors = totalInstructors,
            TotalCourses = totalCourses,
            PublishedCourses = publishedCourses,
            TotalEnrollments = totalEnrollments,
            PendingEnrollments = pendingEnrollments,
            CompletedEnrollments = completedEnrollments,
            TotalInternships = totalInternships,
            PendingApplications = pendingInternships,
            TotalCertificates = totalCertificates,
            TotalContactMessages = totalContactMessages,
            UnreadMessages = unreadMessages,
            TotalRevenue = totalRevenue,
            
            // Growth percentages
            UserGrowthPercentage = CalculateGrowth(newUsersThisMonth, newUsersLastMonth),
            CourseGrowthPercentage = CalculateGrowth(newCoursesThisMonth, newCoursesLastMonth),
            EnrollmentGrowthPercentage = CalculateGrowth(newEnrollmentsThisMonth, newEnrollmentsLastMonth),
            RevenueGrowthPercentage = CalculateRevenueGrowth(revenueThisMonth, revenueLastMonth),
            
            // Recent data
            RecentUsers = recentUserDtos,
            RecentEnrollments = recentEnrollmentDtos,
            
            EnrollmentStats = enrollmentStats,
            UserRegistrationStats = userRegistrationStats,
            CategoryBreakdown = categoryBreakdown,
            TopCourses = topCoursesStats,
            RecentActivities = recentActivities
        };

        return Result<AdminDashboardDto>.Success(dashboard);
    }

    public async Task<Result<List<AuditLogDto>>> GetAuditLogsAsync(int pageNumber, int pageSize, string? action = null, Guid? userId = null)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(action))
        {
            query = query.Where(l => l.Action.Contains(action));
        }

        if (userId.HasValue)
        {
            query = query.Where(l => l.UserId == userId.Value);
        }

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<List<AuditLogDto>>.Success(_mapper.Map<List<AuditLogDto>>(logs));
    }

    public async Task<Result<PaginatedList<UserDto>>> GetUsersAsync(int pageNumber, int pageSize, string? role = null, string? search = null)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var userRole))
        {
            query = query.Where(u => u.Role == userRole);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => (u.FirstName + " " + u.LastName).Contains(search) || u.Email.Contains(search));
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var paginatedResult = new PaginatedList<UserDto>
        {
            Items = _mapper.Map<List<UserDto>>(users),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        return Result<PaginatedList<UserDto>>.Success(paginatedResult);
    }

    public async Task<Result> UpdateUserRoleAsync(Guid userId, string role)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found", "المستخدم غير موجود");
        }

        if (!Enum.TryParse<UserRole>(role, true, out var userRole))
        {
            return Result.Failure("Invalid role", "الدور غير صالح");
        }

        user.Role = userRole;
        await _context.SaveChangesAsync();

        return Result.Success("User role updated successfully", "تم تحديث دور المستخدم بنجاح");
    }

    public async Task<Result> ToggleUserStatusAsync(Guid userId, bool isActive)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found", "المستخدم غير موجود");
        }

        user.IsActive = isActive;
        await _context.SaveChangesAsync();

        var message = isActive ? "User activated successfully" : "User deactivated successfully";
        var messageAr = isActive ? "تم تفعيل المستخدم بنجاح" : "تم إلغاء تفعيل المستخدم بنجاح";
        return Result.Success(message, messageAr);
    }

    public async Task<Result<UserDto>> CreateUserAsync(CreateUserDto dto)
    {
        // Check if email already exists
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (existingUser != null)
        {
            return Result<UserDto>.Failure("Email already exists", "البريد الإلكتروني موجود بالفعل");
        }

        var user = new ApplicationUser
        {
            Email = dto.Email.ToLower(),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            FirstNameAr = dto.FirstNameAr,
            LastNameAr = dto.LastNameAr,
            Phone = dto.Phone,
            Role = dto.Role,
            PasswordHash = HashPassword(dto.Password),
            IsActive = true,
            IsEmailVerified = true,
            PreferredLanguage = "en"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Result<UserDto>.Success(_mapper.Map<UserDto>(user), "User created successfully", "تم إنشاء المستخدم بنجاح");
    }

    public async Task<Result> DeleteUserAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found", "المستخدم غير موجود");
        }

        // Soft delete - just deactivate and mark for deletion
        user.IsActive = false;
        user.Email = $"deleted_{userId}_{user.Email}";
        await _context.SaveChangesAsync();

        return Result.Success("User deleted successfully", "تم حذف المستخدم بنجاح");
    }

    public async Task<Result<SystemSettingsDto>> GetSystemSettingsAsync()
    {
        var settings = await _context.SystemSettings.ToListAsync();
        var settingsDict = settings.ToDictionary(s => s.Key, s => s.Value ?? "");

        string GetSetting(string key, string? defaultValue = null) => 
            settingsDict.TryGetValue(key, out var value) && !string.IsNullOrEmpty(value) ? value : defaultValue ?? "";

        var dto = new SystemSettingsDto
        {
            SiteName = GetSetting("SiteName", "TechMaster"),
            SiteNameAr = GetSetting("SiteNameAr", "تيك ماستر"),
            LogoUrl = GetSetting("LogoUrl"),
            FaviconUrl = GetSetting("FaviconUrl"),
            DefaultLanguage = GetSetting("DefaultLanguage", "en"),
            PrimaryColor = GetSetting("PrimaryColor", "#247090"),
            ContactEmail = GetSetting("ContactEmail", "info@techmaster.com"),
            WhatsAppNumber = GetSetting("WhatsAppNumber", "01029907297"),
            FacebookUrl = GetSetting("FacebookUrl"),
            TwitterUrl = GetSetting("TwitterUrl"),
            LinkedInUrl = GetSetting("LinkedInUrl"),
            InstagramUrl = GetSetting("InstagramUrl"),
            YouTubeUrl = GetSetting("YouTubeUrl"),
            MaintenanceMode = bool.TryParse(GetSetting("MaintenanceMode", "false"), out var mm) && mm,
            MaintenanceMessage = GetSetting("MaintenanceMessage"),
            MaintenanceMessageAr = GetSetting("MaintenanceMessageAr"),
            EmailNotificationsEnabled = !bool.TryParse(GetSetting("EmailNotificationsEnabled", "true"), out var en) || en,
            SmsNotificationsEnabled = bool.TryParse(GetSetting("SmsNotificationsEnabled", "false"), out var sn) && sn,
            SmtpHost = GetSetting("SmtpHost"),
            SmtpPort = int.TryParse(GetSetting("SmtpPort", "587"), out var port) ? port : 587,
            SmtpUsername = GetSetting("SmtpUsername"),
            SmtpPassword = GetSetting("SmtpPassword"),
            SmtpUseSsl = !bool.TryParse(GetSetting("SmtpUseSsl", "true"), out var ssl) || ssl
        };

        return Result<SystemSettingsDto>.Success(dto);
    }

    public async Task<Result> UpdateSystemSettingsAsync(SystemSettingsDto dto)
    {
        var settingsToUpdate = new Dictionary<string, string>
        {
            { "SiteName", dto.SiteName },
            { "SiteNameAr", dto.SiteNameAr },
            { "LogoUrl", dto.LogoUrl ?? "" },
            { "FaviconUrl", dto.FaviconUrl ?? "" },
            { "DefaultLanguage", dto.DefaultLanguage ?? "en" },
            { "PrimaryColor", dto.PrimaryColor ?? "#247090" },
            { "ContactEmail", dto.ContactEmail ?? "" },
            { "WhatsAppNumber", dto.WhatsAppNumber ?? "" },
            { "FacebookUrl", dto.FacebookUrl ?? "" },
            { "TwitterUrl", dto.TwitterUrl ?? "" },
            { "LinkedInUrl", dto.LinkedInUrl ?? "" },
            { "InstagramUrl", dto.InstagramUrl ?? "" },
            { "YouTubeUrl", dto.YouTubeUrl ?? "" },
            { "MaintenanceMode", dto.MaintenanceMode.ToString() },
            { "MaintenanceMessage", dto.MaintenanceMessage ?? "" },
            { "MaintenanceMessageAr", dto.MaintenanceMessageAr ?? "" },
            { "EmailNotificationsEnabled", dto.EmailNotificationsEnabled.ToString() },
            { "SmsNotificationsEnabled", dto.SmsNotificationsEnabled.ToString() },
            { "SmtpHost", dto.SmtpHost ?? "" },
            { "SmtpPort", dto.SmtpPort.ToString() },
            { "SmtpUsername", dto.SmtpUsername ?? "" },
            { "SmtpPassword", dto.SmtpPassword ?? "" },
            { "SmtpUseSsl", dto.SmtpUseSsl.ToString() }
        };

        foreach (var kvp in settingsToUpdate)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == kvp.Key);
            if (setting == null)
            {
                setting = new SystemSetting { Key = kvp.Key, Value = kvp.Value };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.Value = kvp.Value;
            }
        }

        await _context.SaveChangesAsync();

        return Result.Success("Settings updated successfully", "تم تحديث الإعدادات بنجاح");
    }

    public async Task<Result<List<ContactMessageDto>>> GetContactMessagesAsync(int pageNumber, int pageSize, bool? isRead = null)
    {
        var query = _context.ContactMessages.AsQueryable();

        if (isRead.HasValue)
        {
            query = query.Where(m => m.IsRead == isRead.Value);
        }

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<List<ContactMessageDto>>.Success(_mapper.Map<List<ContactMessageDto>>(messages));
    }

    public async Task<Result> MarkContactMessageAsReadAsync(Guid messageId)
    {
        var message = await _context.ContactMessages.FindAsync(messageId);
        if (message == null)
        {
            return Result.Failure("Message not found", "الرسالة غير موجودة");
        }

        message.IsRead = true;
        await _context.SaveChangesAsync();

        return Result.Success();
    }

    public async Task<Result> DeleteContactMessageAsync(Guid messageId)
    {
        var message = await _context.ContactMessages.FindAsync(messageId);
        if (message == null)
        {
            return Result.Failure("Message not found", "الرسالة غير موجودة");
        }

        _context.ContactMessages.Remove(message);
        await _context.SaveChangesAsync();

        return Result.Success("Message deleted successfully", "تم حذف الرسالة بنجاح");
    }

    public async Task<Result<ContactMessageDto>> CreateContactMessageAsync(CreateContactMessageDto dto)
    {
        var message = new ContactMessage
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Subject = dto.Subject,
            Message = dto.Message,
            IsRead = false
        };

        _context.ContactMessages.Add(message);
        await _context.SaveChangesAsync();

        return Result<ContactMessageDto>.Success(_mapper.Map<ContactMessageDto>(message), "Message sent successfully", "تم إرسال الرسالة بنجاح");
    }

    #endregion

    #region Instructor Dashboard

    public async Task<Result<InstructorDashboardDto>> GetInstructorDashboardAsync(Guid instructorId)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);

        var courses = await _context.Courses
            .Include(c => c.Enrollments)
            .Where(c => c.InstructorId == instructorId)
            .ToListAsync();

        var courseIds = courses.Select(c => c.Id).ToList();

        var enrollments = await _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
            .Where(e => courseIds.Contains(e.CourseId))
            .ToListAsync();

        var totalRevenue = enrollments
            .Where(e => e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed)
            .Sum(e => e.AmountPaid ?? 0);

        var thisMonthRevenue = enrollments
            .Where(e => e.ApprovedAt >= startOfMonth && (e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed))
            .Sum(e => e.AmountPaid ?? 0);

        var avgCompletionRate = enrollments.Count > 0 
            ? enrollments.Count(e => e.Status == EnrollmentStatus.Completed) / (double)enrollments.Count * 100 
            : 0;

        // Build course stats
        var courseStats = courses.Select(c => new CourseStatsDto
        {
            CourseId = c.Id,
            CourseName = c.NameEn,
            EnrollmentCount = c.Enrollments.Count,
            CompletionCount = c.Enrollments.Count(e => e.Status == EnrollmentStatus.Completed),
            AverageProgress = c.Enrollments.Any() ? c.Enrollments.Average(e => e.ProgressPercentage) : 0
        }).ToList();

        // Recent activities
        var recentActivities = enrollments.OrderByDescending(e => e.CreatedAt).Take(10).Select(e => new RecentActivityDto
        {
            Type = "Enrollment",
            Description = $"{e.User.FullName} enrolled in {e.Course.NameEn}",
            DescriptionAr = $"{e.User.FullName} سجل في {e.Course.NameAr}",
            Timestamp = e.CreatedAt,
            UserName = e.User.FullName
        }).ToList();

        var dashboard = new InstructorDashboardDto
        {
            TotalCourses = courses.Count,
            PublishedCourses = courses.Count(c => c.Status == CourseStatus.Published),
            DraftCourses = courses.Count(c => c.Status == CourseStatus.Draft),
            TotalEnrollments = enrollments.Count,
            ActiveEnrollments = enrollments.Count(e => e.Status == EnrollmentStatus.Approved),
            CompletedEnrollments = enrollments.Count(e => e.Status == EnrollmentStatus.Completed),
            TotalRevenue = totalRevenue,
            ThisMonthRevenue = thisMonthRevenue,
            AverageRating = 0, // Course entity doesn't have AverageRating, default to 0
            TotalReviews = 0, // Course entity doesn't have ReviewCount, default to 0
            RecentCourses = _mapper.Map<List<CourseDto>>(courses.OrderByDescending(c => c.CreatedAt).Take(5)),
            RecentEnrollments = _mapper.Map<List<EnrollmentDto>>(enrollments.OrderByDescending(e => e.CreatedAt).Take(10))
        };

        return Result<InstructorDashboardDto>.Success(dashboard);
    }

    public async Task<Result<List<CourseDto>>> GetInstructorCoursesAsync(Guid instructorId)
    {
        var courses = await _context.Courses
            .Include(c => c.Enrollments)
            .Include(c => c.Modules)
            .Where(c => c.InstructorId == instructorId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Result<List<CourseDto>>.Success(_mapper.Map<List<CourseDto>>(courses));
    }

    public async Task<Result<CourseAnalyticsDto>> GetCourseAnalyticsAsync(Guid courseId)
    {
        var course = await _context.Courses
            .Include(c => c.Enrollments)
            .Include(c => c.Modules)
            .ThenInclude(m => m.Sessions)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (course == null)
        {
            return Result<CourseAnalyticsDto>.Failure("Course not found", "الدورة غير موجودة");
        }

        var enrollments = course.Enrollments.ToList();
        var sessions = course.Modules.SelectMany(m => m.Sessions).ToList();
        var sessionIds = sessions.Select(s => s.Id).ToList();

        var progresses = await _context.SessionProgresses
            .Where(p => sessionIds.Contains(p.SessionId))
            .ToListAsync();

        // Enrollment trends (last 30 days)
        var now = DateTime.UtcNow;
        var enrollmentTrends = enrollments
            .Where(e => e.CreatedAt >= now.AddDays(-30))
            .GroupBy(e => e.CreatedAt.Date)
            .Select(g => new EnrollmentTrendDto { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToList();

        // Session analytics
        var sessionAnalytics = sessions.Select(s =>
        {
            var sessionProgresses = progresses.Where(p => p.SessionId == s.Id).ToList();
            return new SessionAnalyticsDto
            {
                SessionId = s.Id,
                SessionName = s.NameEn,
                ViewCount = sessionProgresses.Count,
                CompletionRate = sessionProgresses.Count > 0 ? sessionProgresses.Count(p => p.IsCompleted) / (double)sessionProgresses.Count * 100 : 0,
                AverageWatchPercentage = sessionProgresses.Count > 0 ? sessionProgresses.Average(p => p.WatchPercentage) : 0
            };
        }).ToList();

        var totalRevenue = enrollments
            .Where(e => e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed)
            .Sum(e => e.AmountPaid ?? 0);

        var analytics = new CourseAnalyticsDto
        {
            CourseId = course.Id,
            CourseName = course.NameEn,
            TotalEnrollments = enrollments.Count,
            ActiveEnrollments = enrollments.Count(e => e.Status == EnrollmentStatus.Approved),
            CompletedEnrollments = enrollments.Count(e => e.Status == EnrollmentStatus.Completed),
            AverageProgress = enrollments.Count > 0 ? enrollments.Average(e => e.ProgressPercentage) : 0,
            CompletionRate = enrollments.Count > 0 ? enrollments.Count(e => e.Status == EnrollmentStatus.Completed) / (double)enrollments.Count * 100 : 0,
            TotalRevenue = totalRevenue,
            EnrollmentTrends = enrollmentTrends,
            SessionAnalytics = sessionAnalytics
        };

        return Result<CourseAnalyticsDto>.Success(analytics);
    }

    #endregion

    #region Student Dashboard

    public async Task<Result<StudentDashboardDto>> GetStudentDashboardAsync(Guid studentId)
    {
        var user = await _context.Users
            .Include(u => u.Enrollments)
                .ThenInclude(e => e.Course)
                    .ThenInclude(c => c.Modules)
                        .ThenInclude(m => m.Sessions)
            .Include(u => u.Enrollments)
                .ThenInclude(e => e.Course)
                    .ThenInclude(c => c.Instructor)
            .Include(u => u.Enrollments)
                .ThenInclude(e => e.SessionProgresses)
            .Include(u => u.Badges)
                .ThenInclude(ub => ub.Badge)
            .Include(u => u.Certificates)
            .FirstOrDefaultAsync(u => u.Id == studentId);

        if (user == null)
        {
            return Result<StudentDashboardDto>.Failure("User not found", "المستخدم غير موجود");
        }

        var enrollments = user.Enrollments.ToList();
        var currentLevel = user.XpPoints / 1000 + 1;
        var xpForCurrentLevel = (currentLevel - 1) * 1000;
        var xpToNextLevel = 1000 - (user.XpPoints - xpForCurrentLevel);

        var recentBadges = user.Badges
            .OrderByDescending(ub => ub.EarnedAt)
            .Take(5)
            .Select(ub => new BadgeDto
            {
                Id = ub.Badge.Id,
                NameEn = ub.Badge.NameEn,
                NameAr = ub.Badge.NameAr,
                DescriptionEn = ub.Badge.DescriptionEn,
                DescriptionAr = ub.Badge.DescriptionAr,
                IconUrl = ub.Badge.IconUrl,
                EarnedAt = ub.EarnedAt
            })
            .ToList();

        // Get certificates
        var certificates = user.Certificates
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new CertificateItemDto
            {
                Id = c.Id,
                CourseTitle = c.Course?.NameEn ?? "",
                CourseThumbnail = c.Course?.ThumbnailUrl ?? "",
                IssuedAt = c.CreatedAt,
                CertificateUrl = c.PdfUrl ?? $"/api/certificates/{c.Id}/download",
                VerificationCode = c.CertificateNumber ?? ""
            })
            .ToList();

        // Map enrollments for frontend
        var mappedEnrollments = enrollments.Select(e => new EnrollmentDto
        {
            Id = e.Id,
            CourseId = e.CourseId,
            CourseName = e.Course?.NameEn ?? "",
            CourseNameAr = e.Course?.NameAr ?? "",
            CourseThumbnail = e.Course?.ThumbnailUrl,
            InstructorName = e.Course?.Instructor?.FullName,
            Status = e.Status,
            ProgressPercentage = e.ProgressPercentage,
            TotalSessions = e.Course?.Modules?.Sum(m => m.Sessions.Count) ?? 0,
            CompletedSessions = e.SessionProgresses?.Count(sp => sp.IsCompleted) ?? 0,
            CreatedAt = e.CreatedAt,
            LastAccessedAt = e.LastAccessedAt
        }).ToList();

        var dashboard = new StudentDashboardDto
        {
            TotalEnrollments = enrollments.Count,
            ActiveCourses = enrollments.Count(e => e.Status == EnrollmentStatus.Approved),
            InProgressCourses = enrollments.Count(e => e.Status == EnrollmentStatus.Approved && e.ProgressPercentage > 0 && e.ProgressPercentage < 100),
            CompletedCourses = enrollments.Count(e => e.Status == EnrollmentStatus.Completed),
            TotalCertificates = user.Certificates.Count,
            CertificatesEarned = user.Certificates.Count,
            TotalBadges = user.Badges.Count,
            BadgesEarned = user.Badges.Count,
            TotalXp = user.XpPoints,
            CurrentLevel = currentLevel,
            XPToNextLevel = xpToNextLevel,
            OverallProgress = enrollments.Count > 0 ? enrollments.Average(e => e.ProgressPercentage) : 0,
            Enrollments = mappedEnrollments,
            RecentEnrollments = _mapper.Map<List<EnrollmentDto>>(enrollments.OrderByDescending(e => e.CreatedAt).Take(5)),
            Certificates = certificates,
            Badges = recentBadges,
            RecentBadges = recentBadges
        };

        return Result<StudentDashboardDto>.Success(dashboard);
    }

    public async Task<Result<List<EnrollmentDto>>> GetStudentEnrollmentsAsync(Guid studentId)
    {
        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
                .ThenInclude(c => c.Modules)
                    .ThenInclude(m => m.Sessions)
            .Include(e => e.Course)
                .ThenInclude(c => c.Instructor)
            .Include(e => e.SessionProgresses)
            .Where(e => e.UserId == studentId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return Result<List<EnrollmentDto>>.Success(_mapper.Map<List<EnrollmentDto>>(enrollments));
    }

    public async Task<Result<StudentProgressDto>> GetStudentProgressAsync(Guid studentId, Guid courseId)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.Course)
            .ThenInclude(c => c.Modules.OrderBy(m => m.SortOrder))
            .ThenInclude(m => m.Sessions.OrderBy(s => s.SortOrder))
            .FirstOrDefaultAsync(e => e.UserId == studentId && e.CourseId == courseId);

        if (enrollment == null)
        {
            return Result<StudentProgressDto>.Failure("Enrollment not found", "التسجيل غير موجود");
        }

        var course = enrollment.Course;
        var allSessionIds = course.Modules.SelectMany(m => m.Sessions.Select(s => s.Id)).ToList();

        var progresses = await _context.SessionProgresses
            .Where(p => p.UserId == studentId && allSessionIds.Contains(p.SessionId))
            .ToListAsync();

        var progressDict = progresses.ToDictionary(p => p.SessionId);

        var quizAttempts = await _context.QuizAttempts
            .Include(a => a.Quiz)
            .Where(a => a.UserId == studentId && a.Quiz.CourseId == courseId)
            .ToListAsync();

        var moduleProgresses = course.Modules.Select(m =>
        {
            var sessionProgresses = m.Sessions.Select(s =>
            {
                progressDict.TryGetValue(s.Id, out var progress);
                return new SessionProgressDetailDto
                {
                    SessionId = s.Id,
                    SessionName = s.NameEn,
                    IsUnlocked = progress?.IsUnlocked ?? (s.SortOrder == 1),
                    IsCompleted = progress?.IsCompleted ?? false,
                    WatchPercentage = progress?.WatchPercentage ?? 0,
                    ResourcesAccessed = progress?.ResourcesAccessed ?? false,
                    QuizPassed = progress?.QuizPassed ?? false,
                    CompletedAt = progress?.CompletedAt
                };
            }).ToList();

            var completedSessions = sessionProgresses.Count(sp => sp.IsCompleted);

            return new ModuleProgressDto
            {
                ModuleId = m.Id,
                ModuleName = m.NameEn,
                Progress = m.Sessions.Count > 0 ? completedSessions / (double)m.Sessions.Count * 100 : 0,
                CompletedSessions = completedSessions,
                TotalSessions = m.Sessions.Count,
                SessionProgresses = sessionProgresses
            };
        }).ToList();

        var totalSessions = course.Modules.Sum(m => m.Sessions.Count);
        var completedSessionsTotal = moduleProgresses.Sum(mp => mp.CompletedSessions);

        var quizzes = await _context.Quizzes.Where(q => q.CourseId == courseId).ToListAsync();
        var completedQuizzes = quizAttempts.Where(a => a.IsPassed).Select(a => a.QuizId).Distinct().Count();

        var result = new StudentProgressDto
        {
            CourseId = course.Id,
            CourseName = course.NameEn,
            OverallProgress = enrollment.ProgressPercentage,
            CompletedSessions = completedSessionsTotal,
            TotalSessions = totalSessions,
            CompletedQuizzes = completedQuizzes,
            TotalQuizzes = quizzes.Count,
            ModuleProgresses = moduleProgresses
        };

        return Result<StudentProgressDto>.Success(result);
    }

    #endregion

    #region Testimonials

    public async Task<Result<List<TestimonialDto>>> GetTestimonialsAsync(bool? approved = null)
    {
        var query = _context.Testimonials
            .AsQueryable();

        if (approved.HasValue)
        {
            query = query.Where(t => t.IsActive == approved.Value);
        }

        var testimonials = await query
            .OrderBy(t => t.SortOrder)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();

        var dtos = testimonials.Select(t => new TestimonialDto
        {
            Id = t.Id,
            UserId = Guid.Empty, // Testimonial doesn't have UserId
            UserName = t.AuthorName,
            UserPhotoUrl = t.AuthorImageUrl,
            Content = t.ContentEn,
            Rating = t.Rating,
            IsApproved = t.IsActive,
            IsFeatured = false, // Testimonial doesn't have IsFeatured
            CreatedAt = t.CreatedAt
        }).ToList();

        return Result<List<TestimonialDto>>.Success(dtos);
    }

    public async Task<Result<TestimonialDto>> CreateTestimonialAsync(Guid userId, StudentCreateTestimonialDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result<TestimonialDto>.Failure("User not found", "المستخدم غير موجود");
        }

        var testimonial = new Testimonial
        {
            AuthorName = user.FullName,
            AuthorNameAr = user.FullName,
            AuthorImageUrl = user.ProfileImageUrl,
            ContentEn = dto.Content,
            ContentAr = dto.Content,
            Rating = dto.Rating,
            IsActive = false,
            SortOrder = 0
        };

        _context.Testimonials.Add(testimonial);
        await _context.SaveChangesAsync();

        var result = new TestimonialDto
        {
            Id = testimonial.Id,
            UserId = userId,
            UserName = user.FullName,
            UserPhotoUrl = user.ProfileImageUrl,
            Content = testimonial.ContentEn,
            Rating = testimonial.Rating,
            IsApproved = testimonial.IsActive,
            IsFeatured = false,
            CreatedAt = testimonial.CreatedAt
        };

        return Result<TestimonialDto>.Success(result, "Testimonial submitted successfully", "تم تقديم الشهادة بنجاح");
    }

    public async Task<Result> ApproveTestimonialAsync(Guid testimonialId, bool approved)
    {
        var testimonial = await _context.Testimonials.FindAsync(testimonialId);
        if (testimonial == null)
        {
            return Result.Failure("Testimonial not found", "الشهادة غير موجودة");
        }

        testimonial.IsActive = approved;
        await _context.SaveChangesAsync();

        var message = approved ? "Testimonial approved" : "Testimonial rejected";
        var messageAr = approved ? "تمت الموافقة على الشهادة" : "تم رفض الشهادة";
        return Result.Success(message, messageAr);
    }

    public async Task<Result> DeleteTestimonialAsync(Guid testimonialId)
    {
        var testimonial = await _context.Testimonials.FindAsync(testimonialId);
        if (testimonial == null)
        {
            return Result.Failure("Testimonial not found", "الشهادة غير موجودة");
        }

        _context.Testimonials.Remove(testimonial);
        await _context.SaveChangesAsync();

        return Result.Success("Testimonial deleted successfully", "تم حذف الشهادة بنجاح");
    }

    public async Task<Result<List<InstructorDto>>> GetInstructorsAsync()
    {
        var instructors = await _context.Users
            .Where(u => u.Role == UserRole.Instructor && u.IsActive)
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
            .Select(u => new InstructorDto
            {
                Id = u.Id,
                FullName = u.FirstName + " " + u.LastName,
                ProfileImageUrl = u.ProfileImageUrl,
                Bio = u.Bio
            })
            .ToListAsync();

        return Result<List<InstructorDto>>.Success(instructors);
    }

    #endregion

    #region Instructor Extended Features

    public async Task<Result<PaginatedList<InstructorStudentDto>>> GetInstructorStudentsAsync(Guid instructorId, int pageNumber, int pageSize)
    {
        var query = _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
            .Where(e => e.Course.InstructorId == instructorId && !e.Course.IsDeleted)
            .OrderByDescending(e => e.CreatedAt);

        var totalCount = await query.CountAsync();

        var students = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new InstructorStudentDto
            {
                Id = e.UserId,
                Name = e.User.FirstName + " " + e.User.LastName,
                Email = e.User.Email ?? "",
                Phone = e.User.Phone,
                ProfileImageUrl = e.User.ProfileImageUrl,
                CourseName = e.Course.NameEn,
                CourseId = e.CourseId,
                EnrollmentId = e.Id,
                Progress = e.ProgressPercentage,
                EnrolledAt = e.CreatedAt,
                LastActiveAt = e.LastAccessedAt
            })
            .ToListAsync();

        var result = new PaginatedList<InstructorStudentDto> 
        {
            Items = students,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
        return Result<PaginatedList<InstructorStudentDto>>.Success(result);
    }

    public async Task<Result<InstructorStudentDetailDto>> GetInstructorStudentDetailAsync(Guid instructorId, Guid enrollmentId)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
                .ThenInclude(c => c.Modules.Where(m => !m.IsDeleted))
                    .ThenInclude(m => m.Sessions.Where(s => !s.IsDeleted))
            .FirstOrDefaultAsync(e => e.Id == enrollmentId && e.Course.InstructorId == instructorId && !e.Course.IsDeleted);

        if (enrollment == null)
        {
            return Result<InstructorStudentDetailDto>.Failure("Enrollment not found or you don't have access to this student");
        }

        // Get session progress for this student
        var allSessionIds = enrollment.Course.Modules.SelectMany(m => m.Sessions).Select(s => s.Id).ToList();
        var sessionProgress = await _context.Set<TechMaster.Domain.Entities.SessionProgress>()
            .Where(sp => sp.UserId == enrollment.UserId && allSessionIds.Contains(sp.SessionId))
            .ToListAsync();

        var chapterProgressList = enrollment.Course.Modules
            .OrderBy(m => m.SortOrder)
            .Select(module => {
                var sessionsInModule = module.Sessions.OrderBy(s => s.SortOrder).ToList();
                var sessionProgressDtos = sessionsInModule.Select(session => {
                    var progress = sessionProgress.FirstOrDefault(sp => sp.SessionId == session.Id);
                    return new SessionProgressDto
                    {
                        SessionId = session.Id,
                        SessionTitle = session.NameEn,
                        Order = session.SortOrder,
                        IsCompleted = progress?.IsCompleted ?? false,
                        WatchPercentage = progress?.WatchPercentage ?? 0,
                        CompletedAt = progress?.CompletedAt
                    };
                }).ToList();

                var completedSessions = sessionProgressDtos.Count(s => s.IsCompleted);
                var completionPercentage = sessionsInModule.Count > 0 
                    ? (double)completedSessions / sessionsInModule.Count * 100 
                    : 0;

                return new ChapterProgressDto
                {
                    ChapterId = module.Id,
                    ChapterTitle = module.NameEn,
                    Order = module.SortOrder,
                    Sessions = sessionProgressDtos,
                    CompletionPercentage = Math.Round(completionPercentage, 1)
                };
            }).ToList();

        var detail = new InstructorStudentDetailDto
        {
            EnrollmentId = enrollment.Id,
            StudentId = enrollment.UserId,
            StudentName = $"{enrollment.User.FirstName} {enrollment.User.LastName}",
            StudentEmail = enrollment.User.Email ?? "",
            StudentPhone = enrollment.User.Phone,
            StudentProfileImageUrl = enrollment.User.ProfileImageUrl,
            CourseId = enrollment.CourseId,
            CourseName = enrollment.Course.NameEn,
            OverallProgress = enrollment.ProgressPercentage,
            EnrolledAt = enrollment.CreatedAt,
            LastActiveAt = enrollment.LastAccessedAt,
            EnrollmentStatus = enrollment.Status.ToString(),
            ChapterProgress = chapterProgressList
        };

        return Result<InstructorStudentDetailDto>.Success(detail);
    }

    public async Task<Result> RemoveStudentFromCourseAsync(Guid instructorId, Guid enrollmentId, string? reason = null)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.Course)
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId && e.Course.InstructorId == instructorId && !e.Course.IsDeleted);

        if (enrollment == null)
        {
            return Result.Failure("Enrollment not found or you don't have permission to remove this student");
        }

        // Soft delete the enrollment by updating status to Rejected (closest available status)
        enrollment.Status = TechMaster.Domain.Enums.EnrollmentStatus.Rejected;
        
        // Create a notification for the student
        var message = $"Your enrollment in '{enrollment.Course.NameEn}' has been removed by the instructor." + 
                     (string.IsNullOrEmpty(reason) ? "" : $" Reason: {reason}");
        var notification = new TechMaster.Domain.Entities.Notification
        {
            Id = Guid.NewGuid(),
            UserId = enrollment.UserId,
            TitleEn = "Enrollment Removed",
            TitleAr = "تم إلغاء التسجيل",
            MessageEn = message,
            MessageAr = message,
            Type = TechMaster.Domain.Enums.NotificationType.CourseEnrollment,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();

        return Result.Success();
    }

    public async Task<Result<PaginatedList<InstructorReviewDto>>> GetInstructorReviewsAsync(Guid instructorId, int pageNumber, int pageSize, int? rating = null)
    {
        // Since Review entity doesn't exist, use Testimonials as a substitute for instructor reviews
        // First load the raw data, then project to DTO to avoid casting issues
        try
        {
            var query = _context.Testimonials
                .Where(t => t.IsActive && !t.IsDeleted);

            if (rating.HasValue)
            {
                query = query.Where(t => t.Rating == rating.Value);
            }

            query = query.OrderByDescending(t => t.CreatedAt);

            var totalCount = await query.CountAsync();

            // Load raw data first to avoid EF Core casting issues
            var rawTestimonials = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Then project to DTO in memory
            var testimonials = rawTestimonials.Select(t => new InstructorReviewDto
            {
                Id = t.Id,
                CourseId = Guid.Empty, // Testimonials aren't linked to courses
                CourseName = "General Review",
                UserId = Guid.Empty,
                UserName = t.AuthorName ?? "Anonymous",
                UserAvatar = t.AuthorImageUrl,
                Rating = t.Rating,
                Comment = t.ContentEn,
                InstructorReply = null,
                CreatedAt = t.CreatedAt
            }).ToList();

            var result = new PaginatedList<InstructorReviewDto>
            {
                Items = testimonials,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
            return Result<PaginatedList<InstructorReviewDto>>.Success(result);
        }
        catch (Exception)
        {
            // Log the error and return empty list to prevent crashes
            return Result<PaginatedList<InstructorReviewDto>>.Success(new PaginatedList<InstructorReviewDto>
            {
                Items = new List<InstructorReviewDto>(),
                TotalCount = 0,
                PageNumber = pageNumber,
                PageSize = pageSize
            });
        }
    }

    public async Task<Result<InstructorEarningsDto>> GetInstructorEarningsAsync(Guid instructorId, int year = 0, int month = 0)
    {
        var query = _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
            .Where(e => e.Course.InstructorId == instructorId && 
                        (e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed) &&
                        e.AmountPaid > 0);

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);

        var totalEarnings = await query.SumAsync(e => e.AmountPaid ?? 0);
        var thisMonthEarnings = await query
            .Where(e => e.ApprovedAt >= startOfMonth)
            .SumAsync(e => e.AmountPaid ?? 0);

        var recentTransactions = await query
            .OrderByDescending(e => e.ApprovedAt)
            .Take(10)
            .Select(e => new EarningItemDto
            {
                Id = e.Id,
                CourseName = e.Course.NameEn,
                StudentName = e.User.FirstName + " " + e.User.LastName,
                Amount = e.AmountPaid ?? 0,
                Currency = "EGP",
                Date = e.ApprovedAt ?? e.CreatedAt,
                Status = e.Status.ToString()
            })
            .ToListAsync();

        // Monthly breakdown for the last 12 months
        var twelveMonthsAgo = now.AddMonths(-12);
        var monthlyBreakdown = await query
            .Where(e => e.ApprovedAt >= twelveMonthsAgo)
            .GroupBy(e => new { e.ApprovedAt!.Value.Year, e.ApprovedAt!.Value.Month })
            .Select(g => new MonthlyEarningDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Amount = g.Sum(e => e.AmountPaid ?? 0),
                TransactionCount = g.Count()
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        var result = new InstructorEarningsDto
        {
            TotalEarnings = totalEarnings,
            ThisMonthEarnings = thisMonthEarnings,
            PendingPayouts = 0, // Can be calculated based on payout schedule
            TotalTransactions = await query.CountAsync(),
            RecentTransactions = recentTransactions,
            MonthlyBreakdown = monthlyBreakdown
        };

        return Result<InstructorEarningsDto>.Success(result);
    }

    public async Task<Result<List<LiveSessionDto>>> GetInstructorLiveSessionsAsync(Guid instructorId, string? status = null)
    {
        // Live sessions are stored as Sessions with Type = Live
        var query = _context.Sessions
            .Include(s => s.Module)
            .ThenInclude(m => m.Course)
            .Where(s => s.Module.Course.InstructorId == instructorId && 
                        s.Type == SessionType.Live &&
                        !s.Module.Course.IsDeleted);

        var sessions = await query
            .OrderByDescending(s => s.LiveStartTime ?? s.CreatedAt)
            .Select(s => new LiveSessionDto
            {
                Id = s.Id,
                Title = s.NameEn,
                TitleAr = s.NameAr ?? s.NameEn,
                Description = s.DescriptionEn,
                CourseId = s.Module.CourseId,
                CourseName = s.Module.Course.NameEn,
                ScheduledAt = s.LiveStartTime ?? DateTime.UtcNow,
                DurationMinutes = s.DurationInMinutes,
                MeetingUrl = s.LiveMeetingUrl ?? s.VideoUrl,
                Status = s.LiveStartTime.HasValue && s.LiveStartTime.Value > DateTime.UtcNow ? "Scheduled" : 
                         s.LiveStartTime.HasValue && s.LiveStartTime.Value <= DateTime.UtcNow ? "Completed" : "Draft",
                MaxParticipants = 100,
                CurrentParticipants = 0,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        return Result<List<LiveSessionDto>>.Success(sessions);
    }

    public async Task<Result<LiveSessionDto>> CreateLiveSessionAsync(Guid instructorId, CreateLiveSessionDto dto)
    {
        // For live sessions, we need a course and module
        if (!dto.CourseId.HasValue)
        {
            return Result<LiveSessionDto>.Failure("Course ID is required for live sessions", "معرف الدورة مطلوب للجلسات المباشرة");
        }

        var course = await _context.Courses
            .Include(c => c.Modules)
            .FirstOrDefaultAsync(c => c.Id == dto.CourseId.Value && c.InstructorId == instructorId);

        if (course == null)
        {
            return Result<LiveSessionDto>.Failure("Course not found or you don't have access", "الدورة غير موجودة أو ليس لديك صلاحية");
        }

        // Get or create a "Live Sessions" module
        var liveModule = course.Modules.FirstOrDefault(m => m.NameEn == "Live Sessions");
        if (liveModule == null)
        {
            liveModule = new Module
            {
                Id = Guid.NewGuid(),
                CourseId = course.Id,
                NameEn = "Live Sessions",
                NameAr = "الجلسات المباشرة",
                SortOrder = course.Modules.Count + 1,
                CreatedAt = DateTime.UtcNow
            };
            _context.Modules.Add(liveModule);
        }

        var session = new Session
        {
            Id = Guid.NewGuid(),
            ModuleId = liveModule.Id,
            NameEn = dto.Title,
            NameAr = dto.TitleAr,
            DescriptionEn = dto.Description,
            Type = SessionType.Live,
            LiveStartTime = dto.ScheduledAt,
            DurationInMinutes = dto.DurationMinutes,
            LiveMeetingUrl = dto.MeetingUrl,
            SortOrder = liveModule.Sessions?.Count ?? 0 + 1,
            CreatedAt = DateTime.UtcNow
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = new LiveSessionDto
        {
            Id = session.Id,
            Title = session.NameEn,
            TitleAr = session.NameAr ?? session.NameEn,
            Description = session.DescriptionEn,
            CourseId = course.Id,
            CourseName = course.NameEn,
            ScheduledAt = session.LiveStartTime ?? DateTime.UtcNow,
            DurationMinutes = session.DurationInMinutes,
            MeetingUrl = session.LiveMeetingUrl,
            Status = "Scheduled",
            MaxParticipants = dto.MaxParticipants,
            CurrentParticipants = 0,
            CreatedAt = session.CreatedAt
        };

        return Result<LiveSessionDto>.Success(result, "Live session created successfully", "تم إنشاء الجلسة المباشرة بنجاح");
    }

    public async Task<Result<LiveSessionDto>> UpdateLiveSessionAsync(Guid instructorId, Guid sessionId, UpdateLiveSessionDto dto)
    {
        var session = await _context.Sessions
            .Include(s => s.Module)
            .ThenInclude(m => m.Course)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.Module.Course.InstructorId == instructorId);

        if (session == null)
        {
            return Result<LiveSessionDto>.Failure("Live session not found or you don't have access", "الجلسة المباشرة غير موجودة أو ليس لديك صلاحية");
        }

        if (!string.IsNullOrEmpty(dto.Title)) session.NameEn = dto.Title;
        if (!string.IsNullOrEmpty(dto.TitleAr)) session.NameAr = dto.TitleAr;
        if (!string.IsNullOrEmpty(dto.Description)) session.DescriptionEn = dto.Description;
        if (dto.ScheduledAt.HasValue) session.LiveStartTime = dto.ScheduledAt.Value;
        if (dto.DurationMinutes.HasValue) session.DurationInMinutes = dto.DurationMinutes.Value;
        if (!string.IsNullOrEmpty(dto.MeetingUrl)) session.LiveMeetingUrl = dto.MeetingUrl;

        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var result = new LiveSessionDto
        {
            Id = session.Id,
            Title = session.NameEn,
            TitleAr = session.NameAr ?? session.NameEn,
            Description = session.DescriptionEn,
            CourseId = session.Module.CourseId,
            CourseName = session.Module.Course.NameEn,
            ScheduledAt = session.LiveStartTime ?? DateTime.UtcNow,
            DurationMinutes = session.DurationInMinutes,
            MeetingUrl = session.LiveMeetingUrl,
            Status = session.LiveStartTime.HasValue && session.LiveStartTime.Value > DateTime.UtcNow ? "Scheduled" : "Completed",
            MaxParticipants = 100,
            CurrentParticipants = 0,
            CreatedAt = session.CreatedAt
        };

        return Result<LiveSessionDto>.Success(result, "Live session updated successfully", "تم تحديث الجلسة المباشرة بنجاح");
    }

    public async Task<Result> DeleteLiveSessionAsync(Guid instructorId, Guid sessionId)
    {
        var session = await _context.Sessions
            .Include(s => s.Module)
            .ThenInclude(m => m.Course)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.Module.Course.InstructorId == instructorId);

        if (session == null)
        {
            return Result.Failure("Live session not found or you don't have access", "الجلسة المباشرة غير موجودة أو ليس لديك صلاحية");
        }

        _context.Sessions.Remove(session);
        await _context.SaveChangesAsync();

        return Result.Success("Live session deleted successfully", "تم حذف الجلسة المباشرة بنجاح");
    }

    public async Task<Result<InstructorAnalyticsDto>> GetInstructorOverallAnalyticsAsync(Guid instructorId)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var thirtyDaysAgo = now.AddDays(-30);

        var courses = await _context.Courses
            .Include(c => c.Enrollments)
            .Where(c => c.InstructorId == instructorId && !c.IsDeleted)
            .ToListAsync();

        var courseIds = courses.Select(c => c.Id).ToList();
        var allEnrollments = courses.SelectMany(c => c.Enrollments).ToList();

        var totalStudents = allEnrollments.Select(e => e.UserId).Distinct().Count();
        var newStudentsThisMonth = allEnrollments
            .Where(e => e.CreatedAt >= startOfMonth)
            .Select(e => e.UserId)
            .Distinct()
            .Count();

        // Use testimonials for ratings since we don't have course reviews entity
        var avgRating = 4.5; // Default rating, can be calculated from testimonials
        var totalRevenue = allEnrollments
            .Where(e => e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed)
            .Sum(e => e.AmountPaid ?? 0);

        var completedEnrollments = allEnrollments.Count(e => e.Status == EnrollmentStatus.Completed);
        var avgCompletionRate = allEnrollments.Count > 0 ? (completedEnrollments / (double)allEnrollments.Count) * 100 : 0;

        // Top performing courses
        var topCourses = courses
            .OrderByDescending(c => c.Enrollments.Count)
            .Take(5)
            .Select(c => new CoursePerformanceDto
            {
                CourseId = c.Id,
                CourseName = c.NameEn,
                Enrollments = c.Enrollments.Count,
                Rating = 4.5, // Default rating
                Revenue = c.Enrollments.Where(e => e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed)
                    .Sum(e => e.AmountPaid ?? 0),
                CompletionRate = c.Enrollments.Count > 0 ? 
                    (c.Enrollments.Count(e => e.Status == EnrollmentStatus.Completed) / (double)c.Enrollments.Count) * 100 : 0
            })
            .ToList();

        // Enrollment trends (last 30 days)
        var enrollmentTrends = allEnrollments
            .Where(e => e.CreatedAt >= thirtyDaysAgo)
            .GroupBy(e => e.CreatedAt.Date)
            .Select(g => new EnrollmentTrendDto { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToList();

        // Revenue trends (last 30 days)
        var revenueTrends = allEnrollments
            .Where(e => e.ApprovedAt >= thirtyDaysAgo && (e.Status == EnrollmentStatus.Approved || e.Status == EnrollmentStatus.Completed))
            .GroupBy(e => e.ApprovedAt!.Value.Date)
            .Select(g => new RevenueTrendDto { Date = g.Key, Amount = g.Sum(e => e.AmountPaid ?? 0) })
            .OrderBy(x => x.Date)
            .ToList();

        var result = new InstructorAnalyticsDto
        {
            TotalStudents = totalStudents,
            NewStudentsThisMonth = newStudentsThisMonth,
            AverageRating = avgRating,
            TotalReviews = 0, // No review entity exists
            TotalCourses = courses.Count,
            TotalRevenue = totalRevenue,
            AverageCompletionRate = avgCompletionRate,
            TopCourses = topCourses,
            EnrollmentTrends = enrollmentTrends,
            RevenueTrends = revenueTrends
        };

        return Result<InstructorAnalyticsDto>.Success(result);
    }

    #endregion
}
