using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Enrollment;
using TechMaster.Domain.Entities;
using TechMaster.Domain.Enums;
using TechMaster.Infrastructure.Persistence;
using AppStudentDashboardDto = TechMaster.Application.DTOs.Enrollment.StudentDashboardDto;
using AppBadgeDto = TechMaster.Application.DTOs.Enrollment.BadgeDto;

namespace TechMaster.Infrastructure.Services;

public class EnrollmentService : IEnrollmentService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;
    private readonly IProgressService _progressService;

    public EnrollmentService(
        ApplicationDbContext context,
        IMapper mapper,
        INotificationService notificationService,
        IProgressService progressService)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
        _progressService = progressService;
    }

    public async Task<Result<EnrollmentDto>> EnrollAsync(Guid userId, Guid courseId, string? paymentScreenshotUrl = null, string? paymentReference = null)
    {
        var existingEnrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        if (existingEnrollment != null)
        {
            return Result<EnrollmentDto>.Failure("Already enrolled in this course", "أنت مسجل بالفعل في هذه الدورة");
        }

        var course = await _context.Courses.FindAsync(courseId);
        if (course == null)
        {
            return Result<EnrollmentDto>.Failure("Course not found", "الدورة غير موجودة");
        }

        if (course.Status != CourseStatus.Published)
        {
            return Result<EnrollmentDto>.Failure("Course is not available for enrollment", "الدورة غير متاحة للتسجيل");
        }

        var enrollment = new Enrollment
        {
            UserId = userId,
            CourseId = courseId,
            Status = course.Type == CourseType.Free ? EnrollmentStatus.Approved : EnrollmentStatus.PaymentPending,
            PaymentScreenshotUrl = paymentScreenshotUrl,
            PaymentReference = paymentReference
        };

        if (course.Type == CourseType.Free)
        {
            enrollment.ApprovedAt = DateTime.UtcNow;
        }

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        // Initialize progress for free courses
        if (course.Type == CourseType.Free)
        {
            await _progressService.InitializeProgressAsync(enrollment.Id);
        }

        var enrollmentDto = await GetEnrollmentDtoAsync(enrollment.Id);
        return Result<EnrollmentDto>.Success(enrollmentDto!, "Enrollment successful", "تم التسجيل بنجاح");
    }

    public async Task<Result<EnrollmentDto>> EnrollFreeAsync(Guid userId, Guid courseId)
    {
        var existingEnrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        if (existingEnrollment != null)
        {
            return Result<EnrollmentDto>.Failure("Already enrolled in this course", "أنت مسجل بالفعل في هذه الدورة");
        }

        var course = await _context.Courses.FindAsync(courseId);
        if (course == null)
        {
            return Result<EnrollmentDto>.Failure("Course not found", "الدورة غير موجودة");
        }

        if (course.Status != CourseStatus.Published)
        {
            return Result<EnrollmentDto>.Failure("Course is not available for enrollment", "الدورة غير متاحة للتسجيل");
        }

        // Check if course is actually free
        if (course.Type != CourseType.Free && course.Price > 0)
        {
            return Result<EnrollmentDto>.Failure("This course is not free", "هذه الدورة ليست مجانية");
        }

        var enrollment = new Enrollment
        {
            UserId = userId,
            CourseId = courseId,
            Status = EnrollmentStatus.Approved,
            ApprovedAt = DateTime.UtcNow
        };

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        // Initialize progress
        await _progressService.InitializeProgressAsync(enrollment.Id);

        var enrollmentDto = await GetEnrollmentDtoAsync(enrollment.Id);
        return Result<EnrollmentDto>.Success(enrollmentDto!, "Enrollment successful", "تم التسجيل بنجاح");
    }

    public async Task<Result<EnrollmentDetailDto>> GetEnrollmentAsync(Guid enrollmentId)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
            .Include(e => e.SessionProgresses)
                .ThenInclude(sp => sp.Session)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId);

        if (enrollment == null)
        {
            return Result<EnrollmentDetailDto>.Failure("Enrollment not found", "التسجيل غير موجود");
        }

        return Result<EnrollmentDetailDto>.Success(_mapper.Map<EnrollmentDetailDto>(enrollment));
    }

    public async Task<Result<EnrollmentDetailDto>> GetUserEnrollmentAsync(Guid userId, Guid courseId)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
            .Include(e => e.SessionProgresses)
                .ThenInclude(sp => sp.Session)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        if (enrollment == null)
        {
            return Result<EnrollmentDetailDto>.Failure("Enrollment not found", "التسجيل غير موجود");
        }

        return Result<EnrollmentDetailDto>.Success(_mapper.Map<EnrollmentDetailDto>(enrollment));
    }

    public async Task<Result<PaginatedList<EnrollmentDto>>> GetEnrollmentsAsync(int pageNumber, int pageSize, string? status = null, Guid? courseId = null, Guid? userId = null)
    {
        var query = _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
                .ThenInclude(c => c.Instructor)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<EnrollmentStatus>(status, true, out var enrollmentStatus))
        {
            query = query.Where(e => e.Status == enrollmentStatus);
        }

        if (courseId.HasValue)
        {
            query = query.Where(e => e.CourseId == courseId.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(e => e.UserId == userId.Value);
        }

        var totalCount = await query.CountAsync();
        var enrollments = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<PaginatedList<EnrollmentDto>>.Success(new PaginatedList<EnrollmentDto>
        {
            Items = _mapper.Map<List<EnrollmentDto>>(enrollments),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    public async Task<Result<List<EnrollmentDto>>> GetUserEnrollmentsAsync(Guid userId)
    {
        var enrollments = await _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
                .ThenInclude(c => c.Instructor)
            .Include(e => e.Course)
                .ThenInclude(c => c.Modules)
                    .ThenInclude(m => m.Sessions)
            .Include(e => e.SessionProgresses)
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return Result<List<EnrollmentDto>>.Success(_mapper.Map<List<EnrollmentDto>>(enrollments));
    }

    public async Task<Result> ApproveEnrollmentAsync(Guid enrollmentId, ApproveEnrollmentDto dto, string approvedBy)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId);

        if (enrollment == null)
        {
            return Result.Failure("Enrollment not found", "التسجيل غير موجود");
        }

        enrollment.Status = EnrollmentStatus.Approved;
        enrollment.ApprovedAt = DateTime.UtcNow;
        enrollment.ApprovedBy = approvedBy;
        enrollment.PaymentReference = dto.PaymentReference;
        enrollment.PaymentNotes = dto.PaymentNotes;
        enrollment.AmountPaid = dto.AmountPaid;

        await _context.SaveChangesAsync();

        // Initialize progress
        await _progressService.InitializeProgressAsync(enrollment.Id);

        // Send notification
        await _notificationService.CreateNotificationAsync(new Application.DTOs.Notification.CreateNotificationDto
        {
            UserId = enrollment.UserId,
            TitleEn = "Enrollment Approved",
            TitleAr = "تمت الموافقة على التسجيل",
            MessageEn = $"Your enrollment in {enrollment.Course.NameEn} has been approved!",
            MessageAr = $"تمت الموافقة على تسجيلك في {enrollment.Course.NameAr}!",
            Type = NotificationType.PaymentApproved,
            ActionUrl = $"/dashboard/courses/{enrollment.CourseId}"
        });

        return Result.Success("Enrollment approved successfully", "تمت الموافقة على التسجيل بنجاح");
    }

    public async Task<Result> RejectEnrollmentAsync(Guid enrollmentId, string reason)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId);

        if (enrollment == null)
        {
            return Result.Failure("Enrollment not found", "التسجيل غير موجود");
        }

        enrollment.Status = EnrollmentStatus.Rejected;
        enrollment.PaymentNotes = reason;

        await _context.SaveChangesAsync();

        return Result.Success("Enrollment rejected", "تم رفض التسجيل");
    }

    public async Task<Result<AppStudentDashboardDto>> GetStudentDashboardAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.Enrollments)
                .ThenInclude(e => e.Course)
            .Include(u => u.Badges)
                .ThenInclude(ub => ub.Badge)
            .Include(u => u.Certificates)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return Result<AppStudentDashboardDto>.Failure("User not found", "المستخدم غير موجود");
        }

        var enrollments = user.Enrollments.Where(e => e.Status == EnrollmentStatus.Approved).ToList();

        var dashboard = new AppStudentDashboardDto
        {
            TotalEnrollments = enrollments.Count,
            InProgressCourses = enrollments.Count(e => e.ProgressPercentage > 0 && e.ProgressPercentage < 100),
            CompletedCourses = enrollments.Count(e => e.Status == EnrollmentStatus.Completed),
            TotalXp = user.XpPoints,
            BadgesEarned = user.Badges.Count,
            CertificatesEarned = user.Certificates.Count,
            RecentEnrollments = _mapper.Map<List<EnrollmentDto>>(enrollments.OrderByDescending(e => e.CreatedAt).Take(5)),
            RecentBadges = _mapper.Map<List<AppBadgeDto>>(user.Badges.OrderByDescending(ub => ub.EarnedAt).Take(5))
        };

        return Result<AppStudentDashboardDto>.Success(dashboard);
    }

    private async Task<EnrollmentDto?> GetEnrollmentDtoAsync(Guid enrollmentId)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.User)
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId);

        return enrollment != null ? _mapper.Map<EnrollmentDto>(enrollment) : null;
    }
}
