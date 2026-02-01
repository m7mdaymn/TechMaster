using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TechMaster.Domain.Entities;
using TechMaster.Domain.Enums;
using TechMaster.Infrastructure.Persistence;
using System.Security.Cryptography;
using System.Text;

namespace TechMaster.Infrastructure.Seeding;

public static class DatabaseSeeder
{
    private static string HashPassword(string password)
    {
        using var hmac = new HMACSHA512();
        var salt = hmac.Key;
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash);
    }

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        try
        {
            logger.LogInformation("Starting database seeding...");

            // Seed in order of dependencies
            await SeedUsersAsync(context, logger);
            await SeedCategoriesAsync(context, logger);
            await SeedSystemSettingsAsync(context, logger);
            await SeedBadgesAsync(context, logger);
            await SeedCoursesAsync(context, logger);
            await SeedInternshipsAsync(context, logger);
            await SeedTestimonialsAsync(context, logger);

            await context.SaveChangesAsync();
            logger.LogInformation("Database seeding completed successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    private static async Task SeedUsersAsync(ApplicationDbContext context, ILogger logger)
    {
        // Define the expected seeded users with their credentials
        var usersToSeed = new List<(Guid Id, string Email, string Password, string FirstName, string LastName, string FirstNameAr, string LastNameAr, UserRole Role, string Bio, string BioAr, int XpPoints)>
        {
            (Guid.Parse("11111111-1111-1111-1111-111111111111"), "admin@techmaster.com", "Admin@123", "System", "Administrator", "مسؤول", "النظام", UserRole.Admin, "TechMaster Platform Administrator", "مدير منصة ماستر تك", 0),
            (Guid.Parse("22222222-2222-2222-2222-222222222222"), "instructor@techmaster.com", "Instructor@123", "Ahmed", "Mohamed", "أحمد", "محمد", UserRole.Instructor, "Senior Software Engineer with 10+ years of experience.", "مهندس برمجيات أول مع خبرة تزيد عن 10 سنوات.", 0),
            (Guid.Parse("33333333-3333-3333-3333-333333333333"), "student@techmaster.com", "Student@123", "Sara", "Ali", "سارة", "علي", UserRole.Student, "Computer Science student passionate about web development.", "طالبة علوم حاسوب مهتمة بتطوير الويب.", 500)
        };

        logger.LogInformation("Seeding/updating users...");

        foreach (var userData in usersToSeed)
        {
            var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == userData.Email);
            
            if (existingUser != null)
            {
                // Update password hash to ensure login works
                existingUser.PasswordHash = HashPassword(userData.Password);
                existingUser.IsActive = true;
                existingUser.IsEmailVerified = true;
                context.Users.Update(existingUser);
                logger.LogInformation("Updated user: {Email}", userData.Email);
            }
            else
            {
                // Create new user
                var newUser = new ApplicationUser
                {
                    Id = userData.Id,
                    Email = userData.Email,
                    PasswordHash = HashPassword(userData.Password),
                    FirstName = userData.FirstName,
                    LastName = userData.LastName,
                    FirstNameAr = userData.FirstNameAr,
                    LastNameAr = userData.LastNameAr,
                    Role = userData.Role,
                    IsEmailVerified = true,
                    IsActive = true,
                    Bio = userData.Bio,
                    BioAr = userData.BioAr,
                    PreferredLanguage = "ar",
                    XpPoints = userData.XpPoints
                };
                await context.Users.AddAsync(newUser);
                logger.LogInformation("Added new user: {Email}", userData.Email);
            }
        }
        
        await context.SaveChangesAsync();
        logger.LogInformation("Users seeding completed");
    }

    private static async Task SeedCategoriesAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.Categories.AnyAsync())
        {
            logger.LogInformation("Categories already seeded, skipping...");
            return;
        }

        logger.LogInformation("Seeding categories...");

        var categories = new List<Category>
        {
            new Category
            {
                Id = Guid.Parse("c1111111-1111-1111-1111-111111111111"),
                NameEn = "Web Development",
                NameAr = "تطوير الويب",
                DescriptionEn = "Learn to build modern websites and web applications",
                DescriptionAr = "تعلم بناء المواقع والتطبيقات الحديثة",
                Slug = "web-development",
                IconUrl = "/assets/icons/web.svg",
                SortOrder = 1,
                IsActive = true
            },
            new Category
            {
                Id = Guid.Parse("c2222222-2222-2222-2222-222222222222"),
                NameEn = "Mobile Development",
                NameAr = "تطوير التطبيقات",
                DescriptionEn = "Build iOS and Android applications",
                DescriptionAr = "بناء تطبيقات iOS و Android",
                Slug = "mobile-development",
                IconUrl = "/assets/icons/mobile.svg",
                SortOrder = 2,
                IsActive = true
            },
            new Category
            {
                Id = Guid.Parse("c3333333-3333-3333-3333-333333333333"),
                NameEn = "Data Science",
                NameAr = "علم البيانات",
                DescriptionEn = "Analyze data and build machine learning models",
                DescriptionAr = "تحليل البيانات وبناء نماذج التعلم الآلي",
                Slug = "data-science",
                IconUrl = "/assets/icons/data.svg",
                SortOrder = 3,
                IsActive = true
            },
            new Category
            {
                Id = Guid.Parse("c4444444-4444-4444-4444-444444444444"),
                NameEn = "Cloud Computing",
                NameAr = "الحوسبة السحابية",
                DescriptionEn = "Master cloud services and infrastructure",
                DescriptionAr = "إتقان الخدمات والبنية التحتية السحابية",
                Slug = "cloud-computing",
                IconUrl = "/assets/icons/cloud.svg",
                SortOrder = 4,
                IsActive = true
            },
            new Category
            {
                Id = Guid.Parse("c5555555-5555-5555-5555-555555555555"),
                NameEn = "Cybersecurity",
                NameAr = "الأمن السيبراني",
                DescriptionEn = "Learn to protect systems and networks",
                DescriptionAr = "تعلم حماية الأنظمة والشبكات",
                Slug = "cybersecurity",
                IconUrl = "/assets/icons/security.svg",
                SortOrder = 5,
                IsActive = true
            },
            new Category
            {
                Id = Guid.Parse("c6666666-6666-6666-6666-666666666666"),
                NameEn = "DevOps",
                NameAr = "ديف أوبس",
                DescriptionEn = "Automate development and operations",
                DescriptionAr = "أتمتة التطوير والعمليات",
                Slug = "devops",
                IconUrl = "/assets/icons/devops.svg",
                SortOrder = 6,
                IsActive = true
            }
        };

        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} categories", categories.Count);
    }

    private static async Task SeedSystemSettingsAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.SystemSettings.AnyAsync())
        {
            logger.LogInformation("System settings already seeded, skipping...");
            return;
        }

        logger.LogInformation("Seeding system settings...");

        var settings = new List<SystemSetting>
        {
            // General settings
            new SystemSetting { Key = "general.siteName", Value = "TechMaster", ValueAr = "تك ماستر", Category = "General", IsPublic = true },
            new SystemSetting { Key = "general.siteDescription", Value = "The #1 Tech Education Platform in the Arab World", ValueAr = "المنصة الأولى للتعليم التقني في العالم العربي", Category = "General", IsPublic = true },
            new SystemSetting { Key = "general.contactEmail", Value = "support@techmaster.com", Category = "General", IsPublic = true },
            new SystemSetting { Key = "general.supportPhone", Value = "+201029907297", Category = "General", IsPublic = true },
            new SystemSetting { Key = "general.defaultLanguage", Value = "en", Category = "General", IsPublic = true },
            new SystemSetting { Key = "general.timezone", Value = "Africa/Cairo", Category = "General", IsPublic = true },
            
            // Payment settings
            new SystemSetting { Key = "payment.whatsappNumber", Value = "01029907297", Category = "Payment", IsPublic = true },
            new SystemSetting { Key = "payment.currency", Value = "EGP", Category = "Payment", IsPublic = true },
            new SystemSetting { Key = "payment.enableManualPayment", Value = "true", Category = "Payment", IsPublic = false },
            new SystemSetting { Key = "payment.paymentInstructions", Value = "Transfer to Vodafone Cash: 01029907297", ValueAr = "حول على فودافون كاش: 01029907297", Category = "Payment", IsPublic = true },
            
            // Email settings
            new SystemSetting { Key = "email.smtpHost", Value = "smtp.gmail.com", Category = "Email", IsPublic = false },
            new SystemSetting { Key = "email.smtpPort", Value = "587", Category = "Email", IsPublic = false },
            new SystemSetting { Key = "email.smtpUser", Value = "", Category = "Email", IsPublic = false },
            new SystemSetting { Key = "email.smtpPassword", Value = "", Category = "Email", IsPublic = false },
            new SystemSetting { Key = "email.fromEmail", Value = "noreply@techmaster.com", Category = "Email", IsPublic = false },
            new SystemSetting { Key = "email.fromName", Value = "TechMaster", Category = "Email", IsPublic = false },
            
            // Notification settings
            new SystemSetting { Key = "notifications.enableEmailNotifications", Value = "true", Category = "Notifications", IsPublic = false },
            new SystemSetting { Key = "notifications.enablePushNotifications", Value = "false", Category = "Notifications", IsPublic = false },
            new SystemSetting { Key = "notifications.newEnrollmentNotify", Value = "true", Category = "Notifications", IsPublic = false },
            new SystemSetting { Key = "notifications.courseCompletionNotify", Value = "true", Category = "Notifications", IsPublic = false },
            new SystemSetting { Key = "notifications.paymentNotify", Value = "true", Category = "Notifications", IsPublic = false },
            
            // Appearance settings
            new SystemSetting { Key = "appearance.primaryColor", Value = "#6366f1", Category = "Appearance", IsPublic = true },
            new SystemSetting { Key = "appearance.logo", Value = "/assets/images/logo.png", Category = "Appearance", IsPublic = true },
            new SystemSetting { Key = "appearance.favicon", Value = "/assets/images/favicon.ico", Category = "Appearance", IsPublic = true },
            new SystemSetting { Key = "appearance.enableDarkMode", Value = "true", Category = "Appearance", IsPublic = true },
            
            // Social links (keep old format for backward compatibility in landing page)
            new SystemSetting { Key = "FacebookUrl", Value = "https://facebook.com/techmaster", Category = "Social", IsPublic = true },
            new SystemSetting { Key = "TwitterUrl", Value = "https://twitter.com/techmaster", Category = "Social", IsPublic = true },
            new SystemSetting { Key = "LinkedInUrl", Value = "https://linkedin.com/company/techmaster", Category = "Social", IsPublic = true },
            new SystemSetting { Key = "YouTubeUrl", Value = "https://youtube.com/techmaster", Category = "Social", IsPublic = true },
            new SystemSetting { Key = "InstagramUrl", Value = "https://instagram.com/techmaster", Category = "Social", IsPublic = true },
            new SystemSetting { Key = "TikTokUrl", Value = "https://tiktok.com/@techmaster", Category = "Social", IsPublic = true },
            
            // System settings
            new SystemSetting { Key = "MaintenanceMode", Value = "false", Category = "System", IsPublic = false },
            new SystemSetting { Key = "AllowRegistration", Value = "true", Category = "System", IsPublic = false },
            
            // Landing page settings
            new SystemSetting { Key = "HeroTitle", Value = "Master Technology,", ValueAr = "أتقن التكنولوجيا،", Category = "Landing", IsPublic = true },
            new SystemSetting { Key = "HeroTitleHighlight", Value = "Shape Your Future", ValueAr = "اصنع مستقبلك", Category = "Landing", IsPublic = true },
            new SystemSetting { Key = "HeroSubtitle", Value = "Join TechMaster - the leading tech education platform in the Arab world. Learn from industry experts and launch your career in technology.", ValueAr = "انضم إلى تك ماستر - المنصة الرائدة للتعليم التقني في العالم العربي. تعلم من خبراء الصناعة وابدأ مسيرتك المهنية في التكنولوجيا.", Category = "Landing", IsPublic = true },
            new SystemSetting { Key = "StatsStudents", Value = "5000", Category = "Stats", IsPublic = true },
            new SystemSetting { Key = "StatsCourses", Value = "100", Category = "Stats", IsPublic = true },
            new SystemSetting { Key = "StatsInstructors", Value = "50", Category = "Stats", IsPublic = true },
            new SystemSetting { Key = "StatsRating", Value = "4.9", Category = "Stats", IsPublic = true }
        };

        await context.SystemSettings.AddRangeAsync(settings);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} system settings", settings.Count);
    }

    private static async Task SeedBadgesAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.Badges.AnyAsync())
        {
            logger.LogInformation("Badges already seeded, skipping...");
            return;
        }

        logger.LogInformation("Seeding badges...");

        var badges = new List<Badge>
        {
            new Badge { NameEn = "First Step", NameAr = "الخطوة الأولى", DescriptionEn = "Complete your first session", DescriptionAr = "أكمل جلستك الأولى", IconUrl = "🎯", XpReward = 50, Type = BadgeType.FastLearner },
            new Badge { NameEn = "Course Master", NameAr = "متقن الدورة", DescriptionEn = "Complete a full course", DescriptionAr = "أكمل دورة كاملة", IconUrl = "🏆", XpReward = 200, Type = BadgeType.CourseCompletion },
            new Badge { NameEn = "Quiz Champion", NameAr = "بطل الاختبارات", DescriptionEn = "Score 100% on any quiz", DescriptionAr = "احصل على 100% في أي اختبار", IconUrl = "🌟", XpReward = 100, Type = BadgeType.QuizMaster },
            new Badge { NameEn = "Consistent Learner", NameAr = "متعلم مثابر", DescriptionEn = "Learn for 7 days in a row", DescriptionAr = "تعلم لمدة 7 أيام متتالية", IconUrl = "📚", XpReward = 150, Type = BadgeType.Consistent },
            new Badge { NameEn = "Top Performer", NameAr = "الأفضل أداءً", DescriptionEn = "Rank in top 10 of leaderboard", DescriptionAr = "كن ضمن أفضل 10 في لوحة المتصدرين", IconUrl = "🥇", XpReward = 300, Type = BadgeType.TopPerformer }
        };

        await context.Badges.AddRangeAsync(badges);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} badges", badges.Count);
    }

    private static async Task SeedCoursesAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.Courses.AnyAsync())
        {
            logger.LogInformation("Courses already seeded, skipping...");
            return;
        }

        logger.LogInformation("Seeding courses...");

        // Get an instructor from the database - first try the expected ID, otherwise find any instructor
        var expectedInstructorId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var instructor = await context.Users.FirstOrDefaultAsync(u => u.Id == expectedInstructorId);
        if (instructor == null)
        {
            instructor = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Instructor);
        }
        if (instructor == null)
        {
            instructor = await context.Users.FirstOrDefaultAsync();
        }
        if (instructor == null)
        {
            logger.LogWarning("No users found in database, cannot seed courses");
            return;
        }
        var instructorId = instructor.Id;

        // Get categories from the database
        var webDevCategory = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "web-development");
        var mobileDevCategory = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "mobile-development");
        var dataScienceCategory = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "data-science");

        var webDevCategoryId = webDevCategory?.Id ?? (await context.Categories.FirstAsync()).Id;
        var mobileDevCategoryId = mobileDevCategory?.Id ?? webDevCategoryId;
        var dataScienceCategoryId = dataScienceCategory?.Id ?? webDevCategoryId;

        var courses = new List<Course>
        {
            new Course
            {
                Id = Guid.Parse("d1111111-1111-1111-1111-111111111111"),
                NameEn = "Complete Web Development Bootcamp",
                NameAr = "معسكر تطوير الويب الشامل",
                DescriptionEn = "Learn HTML, CSS, JavaScript, React, Node.js and more to become a full-stack web developer. This comprehensive course covers everything from basics to advanced topics.",
                DescriptionAr = "تعلم HTML و CSS و JavaScript و React و Node.js والمزيد لتصبح مطور ويب شامل. هذه الدورة الشاملة تغطي كل شيء من الأساسيات إلى المواضيع المتقدمة.",
                Slug = "complete-web-development-bootcamp",
                ThumbnailUrl = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400",
                Price = 0,
                Type = CourseType.Free,
                Status = CourseStatus.Published,
                Level = "Beginner",
                LevelAr = "مبتدئ",
                CategoryId = webDevCategoryId,
                InstructorId = instructorId,
                RequireSequentialProgress = true,
                IsFeatured = true
            },
            new Course
            {
                Id = Guid.Parse("d2222222-2222-2222-2222-222222222222"),
                NameEn = "Advanced React & Next.js",
                NameAr = "React و Next.js المتقدم",
                DescriptionEn = "Master React.js and Next.js to build modern, production-ready web applications with server-side rendering and static site generation.",
                DescriptionAr = "أتقن React.js و Next.js لبناء تطبيقات ويب حديثة وجاهزة للإنتاج مع التصيير على جانب الخادم وتوليد المواقع الثابتة.",
                Slug = "advanced-react-nextjs",
                ThumbnailUrl = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
                Price = 299,
                Type = CourseType.Paid,
                Status = CourseStatus.Published,
                Level = "Intermediate",
                LevelAr = "متوسط",
                CategoryId = webDevCategoryId,
                InstructorId = instructorId,
                RequireSequentialProgress = true,
                IsFeatured = true
            },
            new Course
            {
                Id = Guid.Parse("d3333333-3333-3333-3333-333333333333"),
                NameEn = "Flutter Mobile Development",
                NameAr = "تطوير تطبيقات الموبايل بـ Flutter",
                DescriptionEn = "Build beautiful, natively compiled mobile applications for iOS and Android from a single codebase using Flutter and Dart.",
                DescriptionAr = "بناء تطبيقات موبايل جميلة ومترجمة أصلياً لـ iOS و Android من قاعدة كود واحدة باستخدام Flutter و Dart.",
                Slug = "flutter-mobile-development",
                ThumbnailUrl = "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400",
                Price = 399,
                Type = CourseType.Paid,
                Status = CourseStatus.Published,
                Level = "Intermediate",
                LevelAr = "متوسط",
                CategoryId = mobileDevCategoryId,
                InstructorId = instructorId,
                RequireSequentialProgress = true,
                IsFeatured = true
            },
            new Course
            {
                Id = Guid.Parse("d4444444-4444-4444-4444-444444444444"),
                NameEn = "Python for Data Science",
                NameAr = "بايثون لعلم البيانات",
                DescriptionEn = "Learn Python programming and data science libraries like Pandas, NumPy, and Matplotlib to analyze data and build insights.",
                DescriptionAr = "تعلم برمجة بايثون ومكتبات علم البيانات مثل Pandas و NumPy و Matplotlib لتحليل البيانات وبناء الرؤى.",
                Slug = "python-for-data-science",
                ThumbnailUrl = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400",
                Price = 199,
                Type = CourseType.Paid,
                Status = CourseStatus.Published,
                Level = "Beginner",
                LevelAr = "مبتدئ",
                CategoryId = dataScienceCategoryId,
                InstructorId = instructorId,
                RequireSequentialProgress = false,
                IsFeatured = false
            }
        };

        await context.Courses.AddRangeAsync(courses);
        await context.SaveChangesAsync();

        // Add modules and sessions to the first course
        var webDevCourse = courses[0];
        var modules = new List<Module>
        {
            new Module
            {
                Id = Guid.Parse("e1111111-1111-1111-1111-111111111111"),
                NameEn = "Introduction to Web Development",
                NameAr = "مقدمة في تطوير الويب",
                DescriptionEn = "Learn the basics of web development",
                DescriptionAr = "تعلم أساسيات تطوير الويب",
                CourseId = webDevCourse.Id,
                SortOrder = 1,
                IsActive = true
            },
            new Module
            {
                Id = Guid.Parse("e2222222-2222-2222-2222-222222222222"),
                NameEn = "HTML & CSS Fundamentals",
                NameAr = "أساسيات HTML و CSS",
                DescriptionEn = "Master HTML structure and CSS styling",
                DescriptionAr = "إتقان بنية HTML وتنسيق CSS",
                CourseId = webDevCourse.Id,
                SortOrder = 2,
                IsActive = true
            }
        };

        await context.Modules.AddRangeAsync(modules);
        await context.SaveChangesAsync();

        // Add sessions
        var sessions = new List<Session>
        {
            new Session
            {
                Id = Guid.Parse("f1111111-1111-1111-1111-111111111111"),
                NameEn = "What is Web Development?",
                NameAr = "ما هو تطوير الويب؟",
                DescriptionEn = "Introduction to web development concepts",
                DescriptionAr = "مقدمة في مفاهيم تطوير الويب",
                ModuleId = modules[0].Id,
                VideoUrl = "https://www.youtube.com/watch?v=example1",
                DurationInMinutes = 15,
                SortOrder = 1,
                Type = SessionType.Recorded,
                IsFree = true,
                IsActive = true,
                RequiredWatchPercentage = 80
            },
            new Session
            {
                Id = Guid.Parse("f2222222-2222-2222-2222-222222222222"),
                NameEn = "Setting Up Your Environment",
                NameAr = "إعداد بيئة العمل",
                DescriptionEn = "Install and configure development tools",
                DescriptionAr = "تثبيت وتهيئة أدوات التطوير",
                ModuleId = modules[0].Id,
                VideoUrl = "https://www.youtube.com/watch?v=example2",
                DurationInMinutes = 25,
                SortOrder = 2,
                Type = SessionType.Recorded,
                IsFree = true,
                IsActive = true,
                RequiredWatchPercentage = 80
            },
            new Session
            {
                Id = Guid.Parse("f3333333-3333-3333-3333-333333333333"),
                NameEn = "HTML Basics",
                NameAr = "أساسيات HTML",
                DescriptionEn = "Learn HTML tags and structure",
                DescriptionAr = "تعلم وسوم HTML وهيكلتها",
                ModuleId = modules[1].Id,
                VideoUrl = "https://www.youtube.com/watch?v=example3",
                DurationInMinutes = 45,
                SortOrder = 1,
                Type = SessionType.Recorded,
                IsFree = false,
                IsActive = true,
                RequiredWatchPercentage = 80
            }
        };

        await context.Sessions.AddRangeAsync(sessions);
        await context.SaveChangesAsync();

        logger.LogInformation("Seeded {Count} courses with modules and sessions", courses.Count);
    }

    private static async Task SeedInternshipsAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.Internships.AnyAsync())
        {
            logger.LogInformation("Internships already seeded, skipping...");
            return;
        }

        logger.LogInformation("Seeding internships...");

        var internships = new List<Internship>
        {
            new Internship
            {
                NameEn = "Frontend Developer Intern",
                NameAr = "متدرب مطور واجهات أمامية",
                DescriptionEn = "Join our team as a frontend developer intern and work on real-world projects using React and TypeScript.",
                DescriptionAr = "انضم لفريقنا كمتدرب مطور واجهات أمامية واعمل على مشاريع حقيقية باستخدام React و TypeScript.",
                Slug = "frontend-developer-intern",
                CompanyName = "TechMaster",
                CompanyLogoUrl = "https://via.placeholder.com/100",
                Location = "Cairo, Egypt",
                LocationAr = "القاهرة، مصر",
                IsRemote = true,
                IsPaid = true,
                Stipend = 5000,
                DurationInWeeks = 12,
                StartDate = DateTime.UtcNow.AddDays(30),
                ApplicationDeadline = DateTime.UtcNow.AddDays(20),
                Status = InternshipStatus.Open,
                MaxApplicants = 10,
                RequirementsEn = "• Knowledge of HTML, CSS, JavaScript\n• Familiarity with React\n• Good communication skills\n• Currently enrolled or recent graduate",
                RequirementsAr = "• معرفة بـ HTML و CSS و JavaScript\n• إلمام بـ React\n• مهارات تواصل جيدة\n• طالب حالي أو خريج حديث",
                BenefitsEn = "• Real project experience\n• Mentorship from senior developers\n• Certificate upon completion\n• Potential full-time offer",
                BenefitsAr = "• خبرة في مشاريع حقيقية\n• إرشاد من مطورين كبار\n• شهادة عند الإكمال\n• فرصة للتوظيف الدائم"
            },
            new Internship
            {
                NameEn = "Backend Developer Intern",
                NameAr = "متدرب مطور خوادم",
                DescriptionEn = "Work on backend systems using .NET and learn enterprise software development practices.",
                DescriptionAr = "اعمل على أنظمة الخوادم باستخدام .NET وتعلم ممارسات تطوير البرمجيات المؤسسية.",
                Slug = "backend-developer-intern",
                CompanyName = "TechMaster",
                CompanyLogoUrl = "https://via.placeholder.com/100",
                Location = "Alexandria, Egypt",
                LocationAr = "الإسكندرية، مصر",
                IsRemote = true,
                IsPaid = true,
                Stipend = 6000,
                DurationInWeeks = 16,
                StartDate = DateTime.UtcNow.AddDays(45),
                ApplicationDeadline = DateTime.UtcNow.AddDays(30),
                Status = InternshipStatus.Open,
                MaxApplicants = 5,
                RequirementsEn = "• Knowledge of C# or similar language\n• Understanding of databases\n• Problem-solving skills",
                RequirementsAr = "• معرفة بـ C# أو لغة مشابهة\n• فهم قواعد البيانات\n• مهارات حل المشكلات",
                BenefitsEn = "• Work on production systems\n• Learn best practices\n• Career guidance",
                BenefitsAr = "• العمل على أنظمة إنتاجية\n• تعلم أفضل الممارسات\n• توجيه مهني"
            }
        };

        await context.Internships.AddRangeAsync(internships);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} internships", internships.Count);
    }

    private static async Task SeedTestimonialsAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.Testimonials.AnyAsync())
        {
            logger.LogInformation("Testimonials already seeded, skipping...");
            return;
        }

        logger.LogInformation("Seeding testimonials...");

        var testimonials = new List<Testimonial>
        {
            new Testimonial
            {
                AuthorName = "Mohamed Hassan",
                AuthorNameAr = "محمد حسن",
                AuthorTitle = "Software Engineer at Google",
                AuthorTitleAr = "مهندس برمجيات في جوجل",
                AuthorImageUrl = "https://randomuser.me/api/portraits/men/1.jpg",
                ContentEn = "TechMaster helped me land my dream job at Google. The courses are well-structured and the instructors are amazing!",
                ContentAr = "ساعدني تك ماستر في الحصول على وظيفة أحلامي في جوجل. الدورات منظمة جيداً والمدربون رائعون!",
                Rating = 5,
                IsActive = true,
                SortOrder = 1
            },
            new Testimonial
            {
                AuthorName = "Fatima Ahmed",
                AuthorNameAr = "فاطمة أحمد",
                AuthorTitle = "Full Stack Developer",
                AuthorTitleAr = "مطورة ويب شاملة",
                AuthorImageUrl = "https://randomuser.me/api/portraits/women/2.jpg",
                ContentEn = "As a complete beginner, I was able to become a professional developer in just 6 months. Best investment in my career!",
                ContentAr = "كمبتدئة تماماً، تمكنت من أن أصبح مطورة محترفة في 6 أشهر فقط. أفضل استثمار في مسيرتي المهنية!",
                Rating = 5,
                IsActive = true,
                SortOrder = 2
            },
            new Testimonial
            {
                AuthorName = "Ali Mahmoud",
                AuthorNameAr = "علي محمود",
                AuthorTitle = "Data Scientist at Amazon",
                AuthorTitleAr = "عالم بيانات في أمازون",
                AuthorImageUrl = "https://randomuser.me/api/portraits/men/3.jpg",
                ContentEn = "The data science track is comprehensive and practical. I learned skills that I use every day at work.",
                ContentAr = "مسار علم البيانات شامل وعملي. تعلمت مهارات أستخدمها كل يوم في العمل.",
                Rating = 5,
                IsActive = true,
                SortOrder = 3
            }
        };

        await context.Testimonials.AddRangeAsync(testimonials);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} testimonials", testimonials.Count);
    }
}
