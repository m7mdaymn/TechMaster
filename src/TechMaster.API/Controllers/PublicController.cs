using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.API.Controllers;

/// <summary>
/// Public endpoints for landing page and settings
/// </summary>
public class PublicController : BaseApiController
{
    private readonly ApplicationDbContext _context;

    public PublicController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get public system settings for landing page
    /// </summary>
    [HttpGet("settings")]
    public async Task<IActionResult> GetPublicSettings()
    {
        var settings = await _context.SystemSettings
            .Where(s => s.IsPublic && !s.IsDeleted)
            .Select(s => new { s.Key, s.Value, s.ValueAr })
            .ToListAsync();

        var result = settings.ToDictionary(s => s.Key, s => new { s.Value, s.ValueAr });
        return Ok(new { IsSuccess = true, Data = result });
    }

    /// <summary>
    /// Get all active categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .Where(c => c.IsActive && !c.IsDeleted)
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.Id,
                c.NameEn,
                c.NameAr,
                c.DescriptionEn,
                c.DescriptionAr,
                c.IconUrl,
                c.ImageUrl,
                CourseCount = c.Courses.Count(x => x.Status == Domain.Enums.CourseStatus.Published && !x.IsDeleted)
            })
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = categories });
    }

    /// <summary>
    /// Get featured courses for landing page
    /// </summary>
    [HttpGet("featured-courses")]
    public async Task<IActionResult> GetFeaturedCourses([FromQuery] int limit = 6)
    {
        var courses = await _context.Courses
            .Include(c => c.Category)
            .Include(c => c.Instructor)
            .Where(c => c.Status == Domain.Enums.CourseStatus.Published && !c.IsDeleted)
            .OrderByDescending(c => c.IsFeatured)
            .ThenByDescending(c => c.CreatedAt)
            .Take(limit)
            .Select(c => new
            {
                c.Id,
                c.Slug,
                Title = c.NameEn,
                TitleAr = c.NameAr,
                Description = c.DescriptionEn,
                DescriptionAr = c.DescriptionAr,
                c.ThumbnailUrl,
                c.Price,
                c.Level,
                c.LevelAr,
                CategoryName = c.Category != null ? c.Category.NameEn : "",
                CategoryNameAr = c.Category != null ? c.Category.NameAr : "",
                InstructorName = c.Instructor.FirstName + " " + c.Instructor.LastName,
                InstructorNameAr = c.Instructor.FirstNameAr + " " + c.Instructor.LastNameAr,
                InstructorAvatarUrl = c.Instructor.ProfileImageUrl,
                TotalDurationMinutes = c.Modules.SelectMany(m => m.Sessions).Sum(s => s.DurationInMinutes),
                EnrollmentCount = c.Enrollments.Count,
                c.IsFeatured
            })
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = courses });
    }

    /// <summary>
    /// Get testimonials for landing page
    /// </summary>
    [HttpGet("testimonials")]
    public async Task<IActionResult> GetTestimonials([FromQuery] int limit = 6, [FromQuery] bool? featured = null)
    {
        var query = _context.Testimonials
            .Where(t => t.IsActive && !t.IsDeleted);

        if (featured == true)
        {
            query = query.Where(t => t.IsFeatured);
        }

        var testimonials = await query
            .OrderBy(t => t.SortOrder)
            .Take(limit)
            .Select(t => new
            {
                t.Id,
                t.AuthorName,
                t.AuthorNameAr,
                t.AuthorTitle,
                t.AuthorTitleAr,
                t.AuthorImageUrl,
                Content = t.ContentEn,
                ContentAr = t.ContentAr,
                t.Rating,
                t.IsFeatured
            })
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = testimonials });
    }

    /// <summary>
    /// Get FAQs for landing page
    /// </summary>
    [HttpGet("faqs")]
    public async Task<IActionResult> GetFAQs([FromQuery] string? category = null)
    {
        var query = _context.FAQs
            .Where(f => f.IsActive && !f.IsDeleted);

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(f => f.Category == category);
        }

        var faqs = await query
            .OrderBy(f => f.SortOrder)
            .Select(f => new
            {
                f.Id,
                Question = f.QuestionEn,
                QuestionAr = f.QuestionAr,
                Answer = f.AnswerEn,
                AnswerAr = f.AnswerAr,
                f.Category,
                f.CategoryAr
            })
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = faqs });
    }

    /// <summary>
    /// Get platform statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var studentCount = await _context.Users.CountAsync(u => u.Role == Domain.Enums.UserRole.Student && u.IsActive);
        var courseCount = await _context.Courses.CountAsync(c => c.Status == Domain.Enums.CourseStatus.Published && !c.IsDeleted);
        var instructorCount = await _context.Users.CountAsync(u => u.Role == Domain.Enums.UserRole.Instructor && u.IsActive);

        // Get stats from settings or calculate
        var settings = await _context.SystemSettings
            .Where(s => s.Category == "Stats")
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        var stats = new
        {
            Students = studentCount > 0 ? studentCount.ToString() : settings.GetValueOrDefault("StatsStudents", "5000"),
            Courses = courseCount > 0 ? courseCount.ToString() : settings.GetValueOrDefault("StatsCourses", "100"),
            Instructors = instructorCount > 0 ? instructorCount.ToString() : settings.GetValueOrDefault("StatsInstructors", "50"),
            Rating = settings.GetValueOrDefault("StatsRating", "4.9")
        };

        return Ok(new { IsSuccess = true, Data = stats });
    }

    /// <summary>
    /// Get active internships for landing page
    /// </summary>
    [HttpGet("internships")]
    public async Task<IActionResult> GetInternships([FromQuery] int limit = 4)
    {
        var internships = await _context.Internships
            .Where(i => i.Status == Domain.Enums.InternshipStatus.Open && !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAt)
            .Take(limit)
            .Select(i => new
            {
                i.Id,
                Title = i.NameEn,
                TitleAr = i.NameAr,
                Description = i.DescriptionEn,
                DescriptionAr = i.DescriptionAr,
                i.CompanyName,
                i.CompanyLogoUrl,
                i.Location,
                LocationAr = i.LocationAr,
                i.IsRemote,
                i.IsPaid,
                i.Stipend,
                i.DurationInWeeks,
                i.StartDate,
                i.ApplicationDeadline,
                ApplicationCount = i.Applications.Count
            })
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = internships });
    }

    /// <summary>
    /// Get featured instructors for landing page
    /// </summary>
    [HttpGet("instructors")]
    public async Task<IActionResult> GetInstructors([FromQuery] int limit = 6)
    {
        var instructors = await _context.Users
            .Where(u => u.Role == Domain.Enums.UserRole.Instructor && u.IsActive && !u.IsDeleted)
            .OrderByDescending(u => u.InstructorCourses.Count)
            .Take(limit)
            .Select(u => new
            {
                u.Id,
                Name = u.FirstName + " " + u.LastName,
                NameAr = (u.FirstNameAr ?? u.FirstName) + " " + (u.LastNameAr ?? u.LastName),
                u.ProfileImageUrl,
                u.Bio,
                BioAr = u.BioAr ?? u.Bio,
                Specialty = u.InstructorCourses
                    .Where(c => c.Category != null)
                    .Select(c => c.Category!.NameEn)
                    .FirstOrDefault() ?? "Instructor",
                SpecialtyAr = u.InstructorCourses
                    .Where(c => c.Category != null)
                    .Select(c => c.Category!.NameAr)
                    .FirstOrDefault() ?? "مدرب",
                CourseCount = u.InstructorCourses.Count(c => c.Status == Domain.Enums.CourseStatus.Published && !c.IsDeleted),
                StudentCount = u.InstructorCourses
                    .SelectMany(c => c.Enrollments)
                    .Where(e => e.Status == Domain.Enums.EnrollmentStatus.Approved || e.Status == Domain.Enums.EnrollmentStatus.Completed)
                    .Select(e => e.UserId)
                    .Distinct()
                    .Count(),
                Rating = 4.5 // Default rating since no Reviews entity exists
            })
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = instructors });
    }

    /// <summary>
    /// Submit contact form
    /// </summary>
    [HttpPost("contact")]
    public async Task<IActionResult> SubmitContact([FromBody] ContactSubmissionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Message))
        {
            return BadRequest(new { IsSuccess = false, Message = "Name, email, and message are required" });
        }

        // Store contact submission in database
        var contactMessage = new Domain.Entities.ContactMessage
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Subject = dto.Subject,
            Message = dto.Message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.ContactMessages.Add(contactMessage);
        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "Your message has been received. We will get back to you soon." });
    }
}

public class ContactSubmissionDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
