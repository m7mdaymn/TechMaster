using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Certificate;
using TechMaster.Domain.Entities;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class CertificateService : ICertificateService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CertificateService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<CertificateDto>> GenerateCertificateAsync(Guid userId, Guid courseId, int? finalScore = null)
    {
        var existingCertificate = await _context.Certificates
            .FirstOrDefaultAsync(c => c.UserId == userId && c.CourseId == courseId && c.IsValid);

        if (existingCertificate != null)
        {
            return Result<CertificateDto>.Failure("Certificate already exists", "الشهادة موجودة بالفعل");
        }

        var user = await _context.Users.FindAsync(userId);
        var course = await _context.Courses
            .Include(c => c.Modules)
                .ThenInclude(m => m.Sessions)
                    .ThenInclude(s => s.Quizzes)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (user == null || course == null)
        {
            return Result<CertificateDto>.Failure("User or course not found", "المستخدم أو الدورة غير موجودة");
        }

        // Check if course requires final assessment
        if (course.RequireFinalAssessment)
        {
            // Find all quiz sessions (final assessment is typically a Quiz type session)
            var quizSessions = course.Modules
                .SelectMany(m => m.Sessions)
                .Where(s => s.Quizzes.Any())
                .ToList();

            if (quizSessions.Any())
            {
                // Check if user has passed at least one quiz with the required passing score
                var userQuizAttempts = await _context.QuizAttempts
                    .Where(qa => qa.UserId == userId && 
                           quizSessions.SelectMany(s => s.Quizzes.Select(q => q.Id)).Contains(qa.QuizId) &&
                           qa.IsPassed)
                    .ToListAsync();

                if (!userQuizAttempts.Any())
                {
                    return Result<CertificateDto>.Failure(
                        "You must pass the final assessment to receive a certificate", 
                        "يجب اجتياز التقييم النهائي للحصول على الشهادة"
                    );
                }

                // Use the highest quiz score as the final score
                var highestScore = userQuizAttempts.Max(qa => qa.Score);
                finalScore = (int)highestScore;
            }
        }

        var certificateNumber = GenerateCertificateNumber();

        var certificate = new Certificate
        {
            UserId = userId,
            CourseId = courseId,
            CertificateNumber = certificateNumber,
            IssuedAt = DateTime.UtcNow,
            FinalScore = finalScore,
            CompletedAt = DateTime.UtcNow,
            QrCodeUrl = $"/api/certificates/verify/{certificateNumber}"
        };

        _context.Certificates.Add(certificate);
        await _context.SaveChangesAsync();

        var result = await _context.Certificates
            .Include(c => c.User)
            .Include(c => c.Course)
            .FirstAsync(c => c.Id == certificate.Id);

        return Result<CertificateDto>.Success(_mapper.Map<CertificateDto>(result), "Certificate generated successfully", "تم إنشاء الشهادة بنجاح");
    }

    public async Task<Result<CertificateDto>> GetCertificateByIdAsync(Guid certificateId)
    {
        var certificate = await _context.Certificates
            .Include(c => c.User)
            .Include(c => c.Course)
            .FirstOrDefaultAsync(c => c.Id == certificateId);

        if (certificate == null)
        {
            return Result<CertificateDto>.Failure("Certificate not found", "الشهادة غير موجودة");
        }

        return Result<CertificateDto>.Success(_mapper.Map<CertificateDto>(certificate));
    }

    public async Task<Result<List<CertificateDto>>> GetUserCertificatesAsync(Guid userId)
    {
        var certificates = await _context.Certificates
            .Include(c => c.User)
            .Include(c => c.Course)
            .Where(c => c.UserId == userId && c.IsValid)
            .OrderByDescending(c => c.IssuedAt)
            .ToListAsync();

        return Result<List<CertificateDto>>.Success(_mapper.Map<List<CertificateDto>>(certificates));
    }

    public async Task<Result<PaginatedList<CertificateDto>>> GetAllCertificatesAsync(int pageNumber, int pageSize, string? search = null, bool? isValid = null)
    {
        var query = _context.Certificates
            .Include(c => c.User)
            .Include(c => c.Course)
            .AsQueryable();

        if (isValid.HasValue)
        {
            query = query.Where(c => c.IsValid == isValid.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c => 
                c.CertificateNumber.Contains(search) ||
                (c.User.FirstName + " " + c.User.LastName).Contains(search) ||
                c.User.Email.Contains(search) ||
                c.Course.NameEn.Contains(search) ||
                c.Course.NameAr.Contains(search));
        }

        query = query.OrderByDescending(c => c.IssuedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = _mapper.Map<List<CertificateDto>>(items);
        var paginatedList = new PaginatedList<CertificateDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Result<PaginatedList<CertificateDto>>.Success(paginatedList);
    }

    public async Task<Result<CertificateVerificationResult>> VerifyCertificateAsync(string certificateNumber)
    {
        var certificate = await _context.Certificates
            .Include(c => c.User)
            .Include(c => c.Course)
            .FirstOrDefaultAsync(c => c.CertificateNumber == certificateNumber);

        if (certificate == null)
        {
            return Result<CertificateVerificationResult>.Success(new CertificateVerificationResult
            {
                IsValid = false,
                Message = "Certificate not found",
                MessageAr = "الشهادة غير موجودة"
            });
        }

        return Result<CertificateVerificationResult>.Success(new CertificateVerificationResult
        {
            IsValid = certificate.IsValid,
            Message = certificate.IsValid ? "Certificate is valid" : "Certificate is invalid",
            MessageAr = certificate.IsValid ? "الشهادة صالحة" : "الشهادة غير صالحة",
            Certificate = _mapper.Map<CertificateDto>(certificate)
        });
    }

    public async Task<Result> InvalidateCertificateAsync(Guid certificateId, string reason)
    {
        var certificate = await _context.Certificates.FindAsync(certificateId);
        if (certificate == null)
        {
            return Result.Failure("Certificate not found", "الشهادة غير موجودة");
        }

        certificate.IsValid = false;
        certificate.InvalidationReason = reason;
        await _context.SaveChangesAsync();

        return Result.Success("Certificate invalidated", "تم إلغاء صلاحية الشهادة");
    }

    public async Task<Result<CertificateDto>> ReissueCertificateAsync(Guid certificateId)
    {
        var oldCertificate = await _context.Certificates.FindAsync(certificateId);
        if (oldCertificate == null)
        {
            return Result<CertificateDto>.Failure("Certificate not found", "الشهادة غير موجودة");
        }

        oldCertificate.IsValid = false;
        oldCertificate.InvalidationReason = "Reissued";

        return await GenerateCertificateAsync(oldCertificate.UserId, oldCertificate.CourseId, oldCertificate.FinalScore);
    }

    private static string GenerateCertificateNumber()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = new Random().Next(1000, 9999);
        return $"TM-{timestamp}-{random}";
    }
}
