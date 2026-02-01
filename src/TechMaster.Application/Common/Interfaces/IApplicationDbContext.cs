using Microsoft.EntityFrameworkCore;
using TechMaster.Domain.Entities;

namespace TechMaster.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<ApplicationUser> Users { get; }
    DbSet<Course> Courses { get; }
    DbSet<Category> Categories { get; }
    DbSet<Module> Modules { get; }
    DbSet<Session> Sessions { get; }
    DbSet<SessionMaterial> SessionMaterials { get; }
    DbSet<CourseMaterial> CourseMaterials { get; }
    DbSet<LibraryItem> LibraryItems { get; }
    DbSet<MaterialAccess> MaterialAccesses { get; }
    DbSet<LibraryItemAccess> LibraryItemAccesses { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<SessionProgress> SessionProgresses { get; }
    DbSet<Quiz> Quizzes { get; }
    DbSet<Question> Questions { get; }
    DbSet<QuestionOption> QuestionOptions { get; }
    DbSet<QuizAttempt> QuizAttempts { get; }
    DbSet<QuestionAnswer> QuestionAnswers { get; }
    DbSet<Certificate> Certificates { get; }
    DbSet<Badge> Badges { get; }
    DbSet<UserBadge> UserBadges { get; }
    DbSet<ChatRoom> ChatRooms { get; }
    DbSet<ChatRoomMember> ChatRoomMembers { get; }
    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<Internship> Internships { get; }
    DbSet<InternshipApplication> InternshipApplications { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<ContactMessage> ContactMessages { get; }
    DbSet<Testimonial> Testimonials { get; }
    DbSet<CoursePrerequisite> CoursePrerequisites { get; }
    DbSet<CourseRating> CourseRatings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
