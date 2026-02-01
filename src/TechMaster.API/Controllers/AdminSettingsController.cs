using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using TechMaster.Domain.Entities;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.API.Controllers;

/// <summary>
/// Admin endpoints for managing system settings and dynamic content
/// </summary>
[Authorize(Policy = "AdminOnly")]
[Route("api/admin-settings")]
public class AdminSettingsController : BaseApiController
{
    private readonly ApplicationDbContext _context;

    public AdminSettingsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private static string GenerateSlug(string text)
    {
        if (string.IsNullOrEmpty(text)) return "";
        var slug = text.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        return slug.Trim('-');
    }

    #region System Settings

    /// <summary>
    /// Get all system settings
    /// </summary>
    [HttpGet("settings")]
    public async Task<IActionResult> GetAllSettings()
    {
        var settings = await _context.SystemSettings
            .Where(s => !s.IsDeleted)
            .OrderBy(s => s.Category)
            .ThenBy(s => s.Key)
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = settings });
    }

    /// <summary>
    /// Get settings by category
    /// </summary>
    [HttpGet("settings/category/{category}")]
    public async Task<IActionResult> GetSettingsByCategory(string category)
    {
        var settings = await _context.SystemSettings
            .Where(s => s.Category == category && !s.IsDeleted)
            .OrderBy(s => s.Key)
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = settings });
    }

    /// <summary>
    /// Update a system setting
    /// </summary>
    [HttpPut("settings/{key}")]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingDto dto)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null)
        {
            // Create new setting
            setting = new SystemSetting
            {
                Key = key,
                Value = dto.Value,
                ValueAr = dto.ValueAr,
                Category = dto.Category ?? "General",
                Description = dto.Description,
                IsPublic = dto.IsPublic
            };
            _context.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = dto.Value;
            setting.ValueAr = dto.ValueAr;
            if (!string.IsNullOrEmpty(dto.Category)) setting.Category = dto.Category;
            if (!string.IsNullOrEmpty(dto.Description)) setting.Description = dto.Description;
            setting.IsPublic = dto.IsPublic;
        }

        await _context.SaveChangesAsync();
        return Ok(new { IsSuccess = true, Message = "Setting updated", Data = setting });
    }

    /// <summary>
    /// Bulk update settings
    /// </summary>
    [HttpPost("settings/bulk")]
    public async Task<IActionResult> BulkUpdateSettings([FromBody] List<UpdateSettingDto> settings)
    {
        foreach (var dto in settings)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == dto.Key);
            if (setting != null)
            {
                setting.Value = dto.Value;
                setting.ValueAr = dto.ValueAr;
            }
            else
            {
                // Create new setting if it doesn't exist
                var category = dto.Key.Contains('.') ? dto.Key.Split('.')[0] : "General";
                var newSetting = new SystemSetting
                {
                    Key = dto.Key,
                    Value = dto.Value,
                    ValueAr = dto.ValueAr,
                    Category = char.ToUpper(category[0]) + category.Substring(1),
                    IsPublic = dto.IsPublic
                };
                _context.SystemSettings.Add(newSetting);
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { IsSuccess = true, Message = "Settings updated" });
    }

    #endregion

    #region Categories Management

    /// <summary>
    /// Get all categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.Id,
                c.NameEn,
                c.NameAr,
                c.DescriptionEn,
                c.DescriptionAr,
                c.Slug,
                c.IconUrl,
                c.ImageUrl,
                c.SortOrder,
                c.IsActive,
                CourseCount = c.Courses.Count(x => !x.IsDeleted)
            })
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = categories });
    }

    /// <summary>
    /// Create a new category
    /// </summary>
    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryDto dto)
    {
        var category = new Category
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            DescriptionEn = dto.DescriptionEn,
            DescriptionAr = dto.DescriptionAr,
            Slug = GenerateSlug(dto.NameEn),
            IconUrl = dto.IconUrl,
            ImageUrl = dto.ImageUrl,
            SortOrder = dto.SortOrder,
            IsActive = dto.IsActive
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "Category created", Data = category });
    }

    /// <summary>
    /// Update a category
    /// </summary>
    [HttpPut("categories/{id:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] CategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return NotFound(new { IsSuccess = false, Message = "Category not found" });
        }

        category.NameEn = dto.NameEn;
        category.NameAr = dto.NameAr;
        category.DescriptionEn = dto.DescriptionEn;
        category.DescriptionAr = dto.DescriptionAr;
        category.IconUrl = dto.IconUrl;
        category.ImageUrl = dto.ImageUrl;
        category.SortOrder = dto.SortOrder;
        category.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "Category updated", Data = category });
    }

    /// <summary>
    /// Delete a category
    /// </summary>
    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return NotFound(new { IsSuccess = false, Message = "Category not found" });
        }

        category.IsDeleted = true;
        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "Category deleted" });
    }

    #endregion

    #region Testimonials Management

    /// <summary>
    /// Get all testimonials
    /// </summary>
    [HttpGet("testimonials")]
    public async Task<IActionResult> GetTestimonials()
    {
        var testimonials = await _context.Testimonials
            .Where(t => !t.IsDeleted)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = testimonials });
    }

    /// <summary>
    /// Create a testimonial
    /// </summary>
    [HttpPost("testimonials")]
    public async Task<IActionResult> CreateTestimonial([FromBody] TestimonialDto dto)
    {
        var testimonial = new Testimonial
        {
            AuthorName = dto.AuthorName,
            AuthorNameAr = dto.AuthorNameAr,
            AuthorTitle = dto.AuthorTitle,
            AuthorTitleAr = dto.AuthorTitleAr,
            AuthorImageUrl = dto.AuthorImageUrl,
            ContentEn = dto.ContentEn,
            ContentAr = dto.ContentAr,
            Rating = dto.Rating,
            IsActive = dto.IsActive,
            IsFeatured = dto.IsFeatured,
            SortOrder = dto.SortOrder
        };

        _context.Testimonials.Add(testimonial);
        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "Testimonial created", Data = testimonial });
    }

    /// <summary>
    /// Update a testimonial
    /// </summary>
    [HttpPut("testimonials/{id:guid}")]
    public async Task<IActionResult> UpdateTestimonial(Guid id, [FromBody] TestimonialDto dto)
    {
        var testimonial = await _context.Testimonials.FindAsync(id);
        if (testimonial == null)
        {
            return NotFound(new { IsSuccess = false, Message = "Testimonial not found" });
        }

        testimonial.AuthorName = dto.AuthorName;
        testimonial.AuthorNameAr = dto.AuthorNameAr;
        testimonial.AuthorTitle = dto.AuthorTitle;
        testimonial.AuthorTitleAr = dto.AuthorTitleAr;
        testimonial.AuthorImageUrl = dto.AuthorImageUrl;
        testimonial.ContentEn = dto.ContentEn;
        testimonial.ContentAr = dto.ContentAr;
        testimonial.Rating = dto.Rating;
        testimonial.IsActive = dto.IsActive;
        testimonial.IsFeatured = dto.IsFeatured;
        testimonial.SortOrder = dto.SortOrder;

        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "Testimonial updated", Data = testimonial });
    }

    /// <summary>
    /// Delete a testimonial
    /// </summary>
    [HttpDelete("testimonials/{id:guid}")]
    public async Task<IActionResult> DeleteTestimonial(Guid id)
    {
        var testimonial = await _context.Testimonials.FindAsync(id);
        if (testimonial == null)
        {
            return NotFound(new { IsSuccess = false, Message = "Testimonial not found" });
        }

        testimonial.IsDeleted = true;
        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "Testimonial deleted" });
    }

    #endregion

    #region FAQ Management

    /// <summary>
    /// Get all FAQs
    /// </summary>
    [HttpGet("faqs")]
    public async Task<IActionResult> GetFAQs()
    {
        var faqs = await _context.FAQs
            .Where(f => !f.IsDeleted)
            .OrderBy(f => f.SortOrder)
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = faqs });
    }

    /// <summary>
    /// Create a FAQ
    /// </summary>
    [HttpPost("faqs")]
    public async Task<IActionResult> CreateFAQ([FromBody] FAQDto dto)
    {
        var faq = new FAQ
        {
            QuestionEn = dto.QuestionEn,
            QuestionAr = dto.QuestionAr,
            AnswerEn = dto.AnswerEn,
            AnswerAr = dto.AnswerAr,
            Category = dto.Category,
            CategoryAr = dto.CategoryAr,
            IsActive = dto.IsActive,
            SortOrder = dto.SortOrder
        };

        _context.FAQs.Add(faq);
        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "FAQ created", Data = faq });
    }

    /// <summary>
    /// Update a FAQ
    /// </summary>
    [HttpPut("faqs/{id:guid}")]
    public async Task<IActionResult> UpdateFAQ(Guid id, [FromBody] FAQDto dto)
    {
        var faq = await _context.FAQs.FindAsync(id);
        if (faq == null)
        {
            return NotFound(new { IsSuccess = false, Message = "FAQ not found" });
        }

        faq.QuestionEn = dto.QuestionEn;
        faq.QuestionAr = dto.QuestionAr;
        faq.AnswerEn = dto.AnswerEn;
        faq.AnswerAr = dto.AnswerAr;
        faq.Category = dto.Category;
        faq.CategoryAr = dto.CategoryAr;
        faq.IsActive = dto.IsActive;
        faq.SortOrder = dto.SortOrder;

        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "FAQ updated", Data = faq });
    }

    /// <summary>
    /// Delete a FAQ
    /// </summary>
    [HttpDelete("faqs/{id:guid}")]
    public async Task<IActionResult> DeleteFAQ(Guid id)
    {
        var faq = await _context.FAQs.FindAsync(id);
        if (faq == null)
        {
            return NotFound(new { IsSuccess = false, Message = "FAQ not found" });
        }

        faq.IsDeleted = true;
        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "FAQ deleted" });
    }

    #endregion

    #region Badges Management

    /// <summary>
    /// Get all badges
    /// </summary>
    [HttpGet("badges")]
    public async Task<IActionResult> GetBadges()
    {
        var badges = await _context.Badges
            .Where(b => !b.IsDeleted)
            .Select(b => new
            {
                b.Id,
                b.NameEn,
                b.NameAr,
                b.DescriptionEn,
                b.DescriptionAr,
                b.IconUrl,
                b.XpReward,
                b.Type,
                EarnedCount = b.UserBadges.Count
            })
            .ToListAsync();

        return Ok(new { IsSuccess = true, Data = badges });
    }

    /// <summary>
    /// Create a badge
    /// </summary>
    [HttpPost("badges")]
    public async Task<IActionResult> CreateBadge([FromBody] BadgeDto dto)
    {
        var badge = new Badge
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            DescriptionEn = dto.DescriptionEn,
            DescriptionAr = dto.DescriptionAr,
            IconUrl = dto.IconUrl,
            XpReward = dto.XpReward,
            Type = dto.Type
        };

        _context.Badges.Add(badge);
        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "Badge created", Data = badge });
    }

    /// <summary>
    /// Update a badge
    /// </summary>
    [HttpPut("badges/{id:guid}")]
    public async Task<IActionResult> UpdateBadge(Guid id, [FromBody] BadgeDto dto)
    {
        var badge = await _context.Badges.FindAsync(id);
        if (badge == null)
        {
            return NotFound(new { IsSuccess = false, Message = "Badge not found" });
        }

        badge.NameEn = dto.NameEn;
        badge.NameAr = dto.NameAr;
        badge.DescriptionEn = dto.DescriptionEn;
        badge.DescriptionAr = dto.DescriptionAr;
        badge.IconUrl = dto.IconUrl;
        badge.XpReward = dto.XpReward;
        badge.Type = dto.Type;

        await _context.SaveChangesAsync();

        return Ok(new { IsSuccess = true, Message = "Badge updated", Data = badge });
    }

    #endregion
}

#region DTOs

public record UpdateSettingDto
{
    public string Key { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
    public string? ValueAr { get; init; }
    public string? Category { get; init; }
    public string? Description { get; init; }
    public bool IsPublic { get; init; }
}

public record CategoryDto
{
    public string NameEn { get; init; } = string.Empty;
    public string NameAr { get; init; } = string.Empty;
    public string? DescriptionEn { get; init; }
    public string? DescriptionAr { get; init; }
    public string? IconUrl { get; init; }
    public string? ImageUrl { get; init; }
    public int SortOrder { get; init; }
    public bool IsActive { get; init; } = true;
}

public record TestimonialDto
{
    public string AuthorName { get; init; } = string.Empty;
    public string AuthorNameAr { get; init; } = string.Empty;
    public string? AuthorTitle { get; init; }
    public string? AuthorTitleAr { get; init; }
    public string? AuthorImageUrl { get; init; }
    public string ContentEn { get; init; } = string.Empty;
    public string ContentAr { get; init; } = string.Empty;
    public int Rating { get; init; } = 5;
    public bool IsActive { get; init; } = true;
    public bool IsFeatured { get; init; } = false;
    public int SortOrder { get; init; }
}

public record FAQDto
{
    public string QuestionEn { get; init; } = string.Empty;
    public string QuestionAr { get; init; } = string.Empty;
    public string AnswerEn { get; init; } = string.Empty;
    public string AnswerAr { get; init; } = string.Empty;
    public string? Category { get; init; }
    public string? CategoryAr { get; init; }
    public bool IsActive { get; init; } = true;
    public int SortOrder { get; init; }
}

public record BadgeDto
{
    public string NameEn { get; init; } = string.Empty;
    public string NameAr { get; init; } = string.Empty;
    public string? DescriptionEn { get; init; }
    public string? DescriptionAr { get; init; }
    public string IconUrl { get; init; } = string.Empty;
    public int XpReward { get; init; }
    public TechMaster.Domain.Enums.BadgeType Type { get; init; }
}

#endregion
