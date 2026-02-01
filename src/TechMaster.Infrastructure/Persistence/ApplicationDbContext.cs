using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Interfaces;
using TechMaster.Domain.Common;
using TechMaster.Domain.Entities;

namespace TechMaster.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService? _currentUserService;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionMaterial> SessionMaterials => Set<SessionMaterial>();
    public DbSet<CourseMaterial> CourseMaterials => Set<CourseMaterial>();
    public DbSet<LibraryItem> LibraryItems => Set<LibraryItem>();
    public DbSet<MaterialAccess> MaterialAccesses => Set<MaterialAccess>();
    public DbSet<LibraryItemAccess> LibraryItemAccesses => Set<LibraryItemAccess>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<SessionProgress> SessionProgresses => Set<SessionProgress>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<QuestionAnswer> QuestionAnswers => Set<QuestionAnswer>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<Badge> Badges => Set<Badge>();
    public DbSet<UserBadge> UserBadges => Set<UserBadge>();
    public DbSet<ChatRoom> ChatRooms => Set<ChatRoom>();
    public DbSet<ChatRoomMember> ChatRoomMembers => Set<ChatRoomMember>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Internship> Internships => Set<Internship>();
    public DbSet<InternshipApplication> InternshipApplications => Set<InternshipApplication>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<FAQ> FAQs => Set<FAQ>();
    public DbSet<CoursePrerequisite> CoursePrerequisites => Set<CoursePrerequisite>();
    public DbSet<CourseRating> CourseRatings => Set<CourseRating>();
    public DbSet<CourseTask> CourseTasks => Set<CourseTask>();
    public DbSet<TaskSubmission> TaskSubmissions => Set<TaskSubmission>();
    public DbSet<TaskAttachment> TaskAttachments => Set<TaskAttachment>();
    public DbSet<SubmissionAttachment> SubmissionAttachments => Set<SubmissionAttachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Global query filter for soft delete
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(
                    GenerateSoftDeleteFilter(entityType.ClrType));
            }
        }
    }

    private static System.Linq.Expressions.LambdaExpression GenerateSoftDeleteFilter(Type type)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(type, "e");
        var property = System.Linq.Expressions.Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
        var condition = System.Linq.Expressions.Expression.Equal(property, System.Linq.Expressions.Expression.Constant(false));
        return System.Linq.Expressions.Expression.Lambda(condition, parameter);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.CreatedBy = _currentUserService?.UserId?.ToString();
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedBy = _currentUserService?.UserId?.ToString();
                    break;
                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = DateTime.UtcNow;
                    entry.Entity.DeletedBy = _currentUserService?.UserId?.ToString();
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
