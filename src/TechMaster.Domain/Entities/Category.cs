using TechMaster.Domain.Common;

namespace TechMaster.Domain.Entities;

public class Category : LocalizedEntity
{
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public Guid? ParentCategoryId { get; set; }
    public virtual Category? ParentCategory { get; set; }

    public virtual ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();
}
