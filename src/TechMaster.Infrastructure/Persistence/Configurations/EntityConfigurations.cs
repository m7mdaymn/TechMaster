using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechMaster.Domain.Entities;

namespace TechMaster.Infrastructure.Persistence.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("Users");
        
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(256);
        
        builder.HasIndex(x => x.Email)
            .IsUnique();

        builder.Property(x => x.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.PasswordHash)
            .HasMaxLength(500);

        builder.Property(x => x.Phone)
            .HasMaxLength(20);

        builder.Property(x => x.ProfileImageUrl)
            .HasMaxLength(500);

        builder.Property(x => x.Bio)
            .HasMaxLength(2000);

        builder.Property(x => x.GoogleId)
            .HasMaxLength(100);

        builder.HasIndex(x => x.GoogleId);
    }
}

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.ToTable("Courses");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.NameAr)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Slug)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(x => x.Slug)
            .IsUnique();

        builder.Property(x => x.Price)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.DiscountPrice)
            .HasColumnType("decimal(18,2)");

        builder.HasOne(x => x.Instructor)
            .WithMany(x => x.InstructorCourses)
            .HasForeignKey(x => x.InstructorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Category)
            .WithMany(x => x.Courses)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.IsFeatured);
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.NameAr)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Slug)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(x => x.Slug)
            .IsUnique();

        builder.HasOne(x => x.ParentCategory)
            .WithMany(x => x.SubCategories)
            .HasForeignKey(x => x.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ModuleConfiguration : IEntityTypeConfiguration<Module>
{
    public void Configure(EntityTypeBuilder<Module> builder)
    {
        builder.ToTable("Modules");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.NameAr)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Modules)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.CourseId, x.SortOrder });
    }
}

public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.ToTable("Sessions");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.NameAr)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.VideoUrl)
            .HasMaxLength(1000);

        builder.Property(x => x.LiveMeetingUrl)
            .HasMaxLength(1000);

        builder.HasOne(x => x.Module)
            .WithMany(x => x.Sessions)
            .HasForeignKey(x => x.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.ModuleId, x.SortOrder });
    }
}

public class SessionMaterialConfiguration : IEntityTypeConfiguration<SessionMaterial>
{
    public void Configure(EntityTypeBuilder<SessionMaterial> builder)
    {
        builder.ToTable("SessionMaterials");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.FileUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.HasOne(x => x.Session)
            .WithMany(x => x.Materials)
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CourseMaterialConfiguration : IEntityTypeConfiguration<CourseMaterial>
{
    public void Configure(EntityTypeBuilder<CourseMaterial> builder)
    {
        builder.ToTable("CourseMaterials");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.FileUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Materials)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> builder)
    {
        builder.ToTable("Enrollments");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.AmountPaid)
            .HasColumnType("decimal(18,2)");

        builder.HasOne(x => x.User)
            .WithMany(x => x.Enrollments)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Enrollments)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.UserId, x.CourseId })
            .IsUnique();

        builder.HasIndex(x => x.Status);
    }
}

public class SessionProgressConfiguration : IEntityTypeConfiguration<SessionProgress>
{
    public void Configure(EntityTypeBuilder<SessionProgress> builder)
    {
        builder.ToTable("SessionProgresses");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.User)
            .WithMany(x => x.SessionProgresses)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Session)
            .WithMany(x => x.Progresses)
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Enrollment)
            .WithMany(x => x.SessionProgresses)
            .HasForeignKey(x => x.EnrollmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.UserId, x.SessionId })
            .IsUnique();
    }
}

public class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> builder)
    {
        builder.ToTable("Quizzes");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasOne(x => x.Session)
            .WithMany(x => x.Quizzes)
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Module)
            .WithMany(x => x.Quizzes)
            .HasForeignKey(x => x.ModuleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Quizzes)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.QuestionTextEn)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(x => x.QuestionTextAr)
            .IsRequired()
            .HasMaxLength(2000);

        builder.HasOne(x => x.Quiz)
            .WithMany(x => x.Questions)
            .HasForeignKey(x => x.QuizId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class QuestionOptionConfiguration : IEntityTypeConfiguration<QuestionOption>
{
    public void Configure(EntityTypeBuilder<QuestionOption> builder)
    {
        builder.ToTable("QuestionOptions");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.OptionTextEn)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(x => x.OptionTextAr)
            .IsRequired()
            .HasMaxLength(1000);

        builder.HasOne(x => x.Question)
            .WithMany(x => x.Options)
            .HasForeignKey(x => x.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class QuizAttemptConfiguration : IEntityTypeConfiguration<QuizAttempt>
{
    public void Configure(EntityTypeBuilder<QuizAttempt> builder)
    {
        builder.ToTable("QuizAttempts");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.User)
            .WithMany(x => x.QuizAttempts)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Quiz)
            .WithMany(x => x.Attempts)
            .HasForeignKey(x => x.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.UserId, x.QuizId });
    }
}

public class QuestionAnswerConfiguration : IEntityTypeConfiguration<QuestionAnswer>
{
    public void Configure(EntityTypeBuilder<QuestionAnswer> builder)
    {
        builder.ToTable("QuestionAnswers");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Attempt)
            .WithMany(x => x.Answers)
            .HasForeignKey(x => x.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Question)
            .WithMany(x => x.Answers)
            .HasForeignKey(x => x.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SelectedOption)
            .WithMany()
            .HasForeignKey(x => x.SelectedOptionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> builder)
    {
        builder.ToTable("Certificates");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CertificateNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(x => x.CertificateNumber)
            .IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(x => x.Certificates)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Certificates)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class BadgeConfiguration : IEntityTypeConfiguration<Badge>
{
    public void Configure(EntityTypeBuilder<Badge> builder)
    {
        builder.ToTable("Badges");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.NameAr)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.IconUrl)
            .IsRequired()
            .HasMaxLength(500);
    }
}

public class UserBadgeConfiguration : IEntityTypeConfiguration<UserBadge>
{
    public void Configure(EntityTypeBuilder<UserBadge> builder)
    {
        builder.ToTable("UserBadges");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.User)
            .WithMany(x => x.Badges)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Badge)
            .WithMany(x => x.UserBadges)
            .HasForeignKey(x => x.BadgeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.UserId, x.BadgeId })
            .IsUnique();
    }
}

public class ChatRoomConfiguration : IEntityTypeConfiguration<ChatRoom>
{
    public void Configure(EntityTypeBuilder<ChatRoom> builder)
    {
        builder.ToTable("ChatRooms");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.ChatRooms)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("ChatMessages");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Content)
            .IsRequired()
            .HasMaxLength(4000);

        builder.HasOne(x => x.ChatRoom)
            .WithMany(x => x.Messages)
            .HasForeignKey(x => x.ChatRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Sender)
            .WithMany(x => x.ChatMessages)
            .HasForeignKey(x => x.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.ChatRoomId);
        builder.HasIndex(x => x.CreatedAt);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TitleEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.MessageEn)
            .IsRequired()
            .HasMaxLength(2000);

        builder.HasOne(x => x.User)
            .WithMany(x => x.Notifications)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.UserId, x.IsRead });
    }
}

public class InternshipConfiguration : IEntityTypeConfiguration<Internship>
{
    public void Configure(EntityTypeBuilder<Internship> builder)
    {
        builder.ToTable("Internships");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.NameAr)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Slug)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(x => x.Slug)
            .IsUnique();

        builder.Property(x => x.Stipend)
            .HasColumnType("decimal(18,2)");

        builder.HasIndex(x => x.Status);
    }
}

public class InternshipApplicationConfiguration : IEntityTypeConfiguration<InternshipApplication>
{
    public void Configure(EntityTypeBuilder<InternshipApplication> builder)
    {
        builder.ToTable("InternshipApplications");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.User)
            .WithMany(x => x.InternshipApplications)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Internship)
            .WithMany(x => x.Applications)
            .HasForeignKey(x => x.InternshipId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.UserId, x.InternshipId })
            .IsUnique();
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.EntityName)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Action)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasOne(x => x.User)
            .WithMany(x => x.AuditLogs)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.EntityName);
        builder.HasIndex(x => x.CreatedAt);
    }
}

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("SystemSettings");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Key)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(x => x.Key)
            .IsUnique();
    }
}

public class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> builder)
    {
        builder.ToTable("ContactMessages");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Subject)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Message)
            .IsRequired()
            .HasMaxLength(4000);

        builder.HasIndex(x => x.IsRead);
    }
}

public class TestimonialConfiguration : IEntityTypeConfiguration<Testimonial>
{
    public void Configure(EntityTypeBuilder<Testimonial> builder)
    {
        builder.ToTable("Testimonials");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.AuthorName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.ContentEn)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(x => x.ContentAr)
            .IsRequired()
            .HasMaxLength(2000);
    }
}

public class LibraryItemConfiguration : IEntityTypeConfiguration<LibraryItem>
{
    public void Configure(EntityTypeBuilder<LibraryItem> builder)
    {
        builder.ToTable("LibraryItems");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.FileUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class CoursePrerequisiteConfiguration : IEntityTypeConfiguration<CoursePrerequisite>
{
    public void Configure(EntityTypeBuilder<CoursePrerequisite> builder)
    {
        builder.ToTable("CoursePrerequisites");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Prerequisites)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.PrerequisiteCourse)
            .WithMany(x => x.IsPrerequisiteFor)
            .HasForeignKey(x => x.PrerequisiteCourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.CourseId, x.PrerequisiteCourseId })
            .IsUnique();
    }
}

public class CourseRatingConfiguration : IEntityTypeConfiguration<CourseRating>
{
    public void Configure(EntityTypeBuilder<CourseRating> builder)
    {
        builder.ToTable("CourseRatings");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Rating)
            .IsRequired();

        builder.Property(x => x.Comment)
            .HasMaxLength(1000);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Ratings)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each user can only rate a course once
        builder.HasIndex(x => new { x.CourseId, x.UserId })
            .IsUnique();
    }
}

public class ChatRoomMemberConfiguration : IEntityTypeConfiguration<ChatRoomMember>
{
    public void Configure(EntityTypeBuilder<ChatRoomMember> builder)
    {
        builder.ToTable("ChatRoomMembers");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.ChatRoom)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.ChatRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.ChatRoomId, x.UserId })
            .IsUnique();
    }
}

public class MaterialAccessConfiguration : IEntityTypeConfiguration<MaterialAccess>
{
    public void Configure(EntityTypeBuilder<MaterialAccess> builder)
    {
        builder.ToTable("MaterialAccesses");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Material)
            .WithMany(x => x.Accesses)
            .HasForeignKey(x => x.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class LibraryItemAccessConfiguration : IEntityTypeConfiguration<LibraryItemAccess>
{
    public void Configure(EntityTypeBuilder<LibraryItemAccess> builder)
    {
        builder.ToTable("LibraryItemAccesses");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.LibraryItem)
            .WithMany(x => x.Accesses)
            .HasForeignKey(x => x.LibraryItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CourseTaskConfiguration : IEntityTypeConfiguration<CourseTask>
{
    public void Configure(EntityTypeBuilder<CourseTask> builder)
    {
        builder.ToTable("CourseTasks");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.NameAr)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Tasks)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Internship)
            .WithMany(x => x.Tasks)
            .HasForeignKey(x => x.InternshipId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Session)
            .WithMany()
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CreatedByUser)
            .WithMany()
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.CourseId, x.SortOrder });
        builder.HasIndex(x => new { x.InternshipId, x.SortOrder });
    }
}

public class TaskSubmissionConfiguration : IEntityTypeConfiguration<TaskSubmission>
{
    public void Configure(EntityTypeBuilder<TaskSubmission> builder)
    {
        builder.ToTable("TaskSubmissions");
        
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Task)
            .WithMany(x => x.Submissions)
            .HasForeignKey(x => x.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.GradedByUser)
            .WithMany()
            .HasForeignKey(x => x.GradedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.TaskId, x.UserId });
    }
}

public class TaskAttachmentConfiguration : IEntityTypeConfiguration<TaskAttachment>
{
    public void Configure(EntityTypeBuilder<TaskAttachment> builder)
    {
        builder.ToTable("TaskAttachments");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FileName)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.FileUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.HasOne(x => x.Task)
            .WithMany(x => x.Attachments)
            .HasForeignKey(x => x.TaskId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SubmissionAttachmentConfiguration : IEntityTypeConfiguration<SubmissionAttachment>
{
    public void Configure(EntityTypeBuilder<SubmissionAttachment> builder)
    {
        builder.ToTable("SubmissionAttachments");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FileName)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.FileUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.HasOne(x => x.Submission)
            .WithMany(x => x.Attachments)
            .HasForeignKey(x => x.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
