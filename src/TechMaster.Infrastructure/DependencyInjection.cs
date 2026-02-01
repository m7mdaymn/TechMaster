using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TechMaster.Application.Common.Interfaces;
using TechMaster.Infrastructure.Persistence;
using TechMaster.Infrastructure.Services;

namespace TechMaster.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICourseService, CourseService>();
        services.AddScoped<IEnrollmentService, EnrollmentService>();
        services.AddScoped<IQuizService, QuizService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<ICertificateService, CertificateService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IProgressService, ProgressService>();
        services.AddScoped<IGamificationService, GamificationService>();
        services.AddScoped<IInternshipService, InternshipService>();
        services.AddScoped<ILibraryService, LibraryService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }
}
