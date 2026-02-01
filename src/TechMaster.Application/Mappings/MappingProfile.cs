using AutoMapper;
using TechMaster.Application.DTOs.Admin;
using TechMaster.Application.DTOs.Auth;
using TechMaster.Application.DTOs.Certificate;
using TechMaster.Application.DTOs.Chat;
using TechMaster.Application.DTOs.Course;
using TechMaster.Application.DTOs.Enrollment;
using TechMaster.Application.DTOs.Internship;
using TechMaster.Application.DTOs.Library;
using TechMaster.Application.DTOs.Notification;
using TechMaster.Application.DTOs.Quiz;
using TechMaster.Domain.Entities;
using TechMaster.Domain.Enums;

namespace TechMaster.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<ApplicationUser, UserDto>()
            .ForMember(d => d.FullName, opt => opt.MapFrom(s => s.FullName));
        CreateMap<ApplicationUser, InstructorDto>()
            .ForMember(d => d.FullName, opt => opt.MapFrom(s => s.FullName))
            .ForMember(d => d.FullNameAr, opt => opt.MapFrom(s => s.FullNameAr));

        // Category mappings
        CreateMap<Category, CategoryDto>()
            .ForMember(d => d.CourseCount, opt => opt.MapFrom(s => s.Courses.Count));
        CreateMap<CreateCategoryDto, Category>();

        // Course mappings
        CreateMap<Course, CourseDto>()
            .ForMember(d => d.EnrollmentCount, opt => opt.MapFrom(s => s.Enrollments.Count))
            .ForMember(d => d.ModuleCount, opt => opt.MapFrom(s => s.Modules.Count))
            .ForMember(d => d.SessionCount, opt => opt.MapFrom(s => s.Modules.Sum(m => m.Sessions.Count)));
        CreateMap<Course, CourseDetailDto>()
            .ForMember(d => d.EnrollmentCount, opt => opt.MapFrom(s => s.Enrollments.Count))
            .ForMember(d => d.ModuleCount, opt => opt.MapFrom(s => s.Modules.Count))
            .ForMember(d => d.SessionCount, opt => opt.MapFrom(s => s.Modules.Sum(m => m.Sessions.Count)))
            .ForMember(d => d.Modules, opt => opt.MapFrom(s => s.Modules.OrderBy(m => m.SortOrder)));
        CreateMap<CreateCourseDto, Course>()
            .ForMember(d => d.Modules, opt => opt.Ignore()); // Modules are created manually in CourseService
        CreateMap<UpdateCourseDto, Course>();

        CreateMap<CoursePrerequisite, CoursePrerequisiteDto>()
            .ForMember(d => d.CourseId, opt => opt.MapFrom(s => s.PrerequisiteCourseId))
            .ForMember(d => d.NameEn, opt => opt.MapFrom(s => s.PrerequisiteCourse.NameEn))
            .ForMember(d => d.NameAr, opt => opt.MapFrom(s => s.PrerequisiteCourse.NameAr))
            .ForMember(d => d.Slug, opt => opt.MapFrom(s => s.PrerequisiteCourse.Slug));

        // Module mappings
        CreateMap<Module, ModuleDto>()
            .ForMember(d => d.SessionCount, opt => opt.MapFrom(s => s.Sessions.Count))
            .ForMember(d => d.Sessions, opt => opt.MapFrom(s => s.Sessions.OrderBy(sess => sess.SortOrder)));
        CreateMap<CreateModuleDto, Module>();

        // Session mappings
        CreateMap<Session, SessionDto>()
            .ForMember(d => d.HasQuiz, opt => opt.MapFrom(s => s.Quizzes.Any()))
            .ForMember(d => d.PdfUrl, opt => opt.MapFrom(s => 
                s.Materials.FirstOrDefault(m => m.Type == MaterialType.PDF) != null 
                    ? s.Materials.First(m => m.Type == MaterialType.PDF).FileUrl 
                    : null))
            .ForMember(d => d.Content, opt => opt.MapFrom(s => s.DescriptionEn))
            .ForMember(d => d.QuizTimeLimit, opt => opt.MapFrom(s => 
                s.Quizzes.FirstOrDefault() != null 
                    ? (int?)s.Quizzes.First().TimeLimit 
                    : null))
            .ForMember(d => d.QuizQuestions, opt => opt.MapFrom(s => 
                s.Quizzes.SelectMany(q => q.Questions.Select(quest => new QuizQuestionForSessionDto
                {
                    Id = quest.Id,
                    QuestionEn = quest.QuestionTextEn,
                    QuestionAr = quest.QuestionTextAr,
                    Type = quest.Options.Count(o => o.IsCorrect) > 1 ? "multiple" : "single",
                    Points = quest.Points,
                    Options = quest.Options.Select(o => new QuizOptionForSessionDto
                    {
                        TextEn = o.OptionTextEn,
                        TextAr = o.OptionTextAr,
                        IsCorrect = o.IsCorrect
                    }).ToList()
                })).ToList()));
        CreateMap<CreateSessionDto, Session>();

        // Material mappings
        CreateMap<SessionMaterial, SessionMaterialDto>();
        CreateMap<CreateSessionMaterialDto, SessionMaterial>();
        CreateMap<CourseMaterial, SessionMaterialDto>();

        // Enrollment mappings
        CreateMap<Enrollment, EnrollmentDto>()
            .ForMember(d => d.UserName, opt => opt.MapFrom(s => s.User.FullName))
            .ForMember(d => d.UserEmail, opt => opt.MapFrom(s => s.User.Email))
            .ForMember(d => d.UserPhone, opt => opt.MapFrom(s => s.User.Phone))
            .ForMember(d => d.UserAvatar, opt => opt.MapFrom(s => s.User.ProfileImageUrl))
            .ForMember(d => d.CourseName, opt => opt.MapFrom(s => s.Course.NameEn))
            .ForMember(d => d.CourseNameAr, opt => opt.MapFrom(s => s.Course.NameAr))
            .ForMember(d => d.CourseThumbnail, opt => opt.MapFrom(s => s.Course.ThumbnailUrl))
            .ForMember(d => d.InstructorName, opt => opt.MapFrom(s => s.Course.Instructor != null ? s.Course.Instructor.FullName : null))
            .ForMember(d => d.CoursePrice, opt => opt.MapFrom(s => s.Course.Price))
            .ForMember(d => d.TotalSessions, opt => opt.MapFrom(s => s.Course.Modules.Sum(m => m.Sessions.Count)))
            .ForMember(d => d.CompletedSessions, opt => opt.MapFrom(s => s.SessionProgresses.Count(sp => sp.IsCompleted)));
        CreateMap<Enrollment, EnrollmentDetailDto>()
            .ForMember(d => d.UserName, opt => opt.MapFrom(s => s.User.FullName))
            .ForMember(d => d.UserEmail, opt => opt.MapFrom(s => s.User.Email))
            .ForMember(d => d.UserPhone, opt => opt.MapFrom(s => s.User.Phone))
            .ForMember(d => d.UserAvatar, opt => opt.MapFrom(s => s.User.ProfileImageUrl))
            .ForMember(d => d.CourseName, opt => opt.MapFrom(s => s.Course.NameEn))
            .ForMember(d => d.CourseNameAr, opt => opt.MapFrom(s => s.Course.NameAr))
            .ForMember(d => d.CourseThumbnail, opt => opt.MapFrom(s => s.Course.ThumbnailUrl))
            .ForMember(d => d.InstructorName, opt => opt.MapFrom(s => s.Course.Instructor != null ? s.Course.Instructor.FullName : null))
            .ForMember(d => d.CoursePrice, opt => opt.MapFrom(s => s.Course.Price));

        // Session Progress mappings
        CreateMap<SessionProgress, SessionProgressDto>()
            .ForMember(d => d.SessionName, opt => opt.MapFrom(s => s.Session.NameEn))
            .ForMember(d => d.SessionNameAr, opt => opt.MapFrom(s => s.Session.NameAr));

        // Quiz mappings
        CreateMap<Quiz, QuizDto>()
            .ForMember(d => d.QuestionCount, opt => opt.MapFrom(s => s.Questions.Count))
            .ForMember(d => d.TotalPoints, opt => opt.MapFrom(s => s.Questions.Sum(q => q.Points)));
        CreateMap<Quiz, QuizDetailDto>()
            .ForMember(d => d.QuestionCount, opt => opt.MapFrom(s => s.Questions.Count))
            .ForMember(d => d.TotalPoints, opt => opt.MapFrom(s => s.Questions.Sum(q => q.Points)));
        CreateMap<CreateQuizDto, Quiz>();

        CreateMap<Question, QuestionDto>();
        CreateMap<CreateQuestionDto, Question>();

        CreateMap<QuestionOption, QuestionOptionDto>();
        CreateMap<CreateQuestionOptionDto, QuestionOption>();

        CreateMap<QuizAttempt, QuizAttemptDto>()
            .ForMember(d => d.QuizName, opt => opt.MapFrom(s => s.Quiz.NameEn));

        // Certificate mappings
        CreateMap<Certificate, CertificateDto>()
            .ForMember(d => d.UserName, opt => opt.MapFrom(s => s.User.FullName))
            .ForMember(d => d.CourseName, opt => opt.MapFrom(s => s.Course.NameEn))
            .ForMember(d => d.CourseNameAr, opt => opt.MapFrom(s => s.Course.NameAr));

        // Badge mappings
        CreateMap<Badge, BadgeDto>();
        CreateMap<UserBadge, BadgeDto>()
            .ForMember(d => d.Id, opt => opt.MapFrom(s => s.Badge.Id))
            .ForMember(d => d.NameEn, opt => opt.MapFrom(s => s.Badge.NameEn))
            .ForMember(d => d.NameAr, opt => opt.MapFrom(s => s.Badge.NameAr))
            .ForMember(d => d.DescriptionEn, opt => opt.MapFrom(s => s.Badge.DescriptionEn))
            .ForMember(d => d.DescriptionAr, opt => opt.MapFrom(s => s.Badge.DescriptionAr))
            .ForMember(d => d.IconUrl, opt => opt.MapFrom(s => s.Badge.IconUrl))
            .ForMember(d => d.XpReward, opt => opt.MapFrom(s => s.Badge.XpReward))
            .ForMember(d => d.EarnedAt, opt => opt.MapFrom(s => s.EarnedAt));

        // Chat mappings
        CreateMap<ChatRoom, ChatRoomDto>()
            .ForMember(d => d.CourseName, opt => opt.MapFrom(s => s.Course.NameEn))
            .ForMember(d => d.MemberCount, opt => opt.MapFrom(s => s.Members.Count));
        CreateMap<ChatMessage, ChatMessageDto>()
            .ForMember(d => d.SenderName, opt => opt.MapFrom(s => s.Sender.FullName))
            .ForMember(d => d.SenderProfileImage, opt => opt.MapFrom(s => s.Sender.ProfileImageUrl));

        // Notification mappings
        CreateMap<Notification, NotificationDto>();
        CreateMap<CreateNotificationDto, Notification>();

        // Internship mappings
        CreateMap<Internship, InternshipDto>()
            .ForMember(d => d.ApplicationCount, opt => opt.MapFrom(s => s.Applications.Count));
        CreateMap<CreateInternshipDto, Internship>();

        CreateMap<InternshipApplication, InternshipApplicationDto>()
            .ForMember(d => d.UserName, opt => opt.MapFrom(s => s.User.FullName))
            .ForMember(d => d.UserEmail, opt => opt.MapFrom(s => s.User.Email))
            .ForMember(d => d.InternshipName, opt => opt.MapFrom(s => s.Internship.NameEn));
        CreateMap<CreateInternshipApplicationDto, InternshipApplication>();

        // Admin/System mappings
        CreateMap<AuditLog, AuditLogDto>()
            .ForMember(d => d.UserName, opt => opt.MapFrom(s => s.User != null ? s.User.FullName : null));
        CreateMap<ContactMessage, ContactMessageDto>();
        CreateMap<CreateContactMessageDto, ContactMessage>();
        CreateMap<Testimonial, TestimonialDto>();
        CreateMap<CreateTestimonialDto, Testimonial>();

        // Library mappings
        CreateMap<LibraryItem, LibraryItemDto>()
            .ForMember(d => d.CategoryName, opt => opt.MapFrom(s => s.Category != null ? s.Category.NameEn : null));
        CreateMap<CreateLibraryItemDto, LibraryItem>();
    }
}
