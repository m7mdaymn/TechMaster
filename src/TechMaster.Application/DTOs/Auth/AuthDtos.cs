using TechMaster.Domain.Enums;

namespace TechMaster.Application.DTOs.Auth;

public class RegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? FirstNameAr { get; set; }
    public string? LastNameAr { get; set; }
    public string? Phone { get; set; }
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class GoogleLoginDto
{
    public string IdToken { get; set; } = string.Empty;
}

public class RefreshTokenDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public bool IsSuccess { get; set; }
    public string? Message { get; set; }
    public string? MessageAr { get; set; }
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? TokenExpiry { get; set; }
    public UserDto? User { get; set; }
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? FirstNameAr { get; set; }
    public string? LastNameAr { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Bio { get; set; }
    public string? BioAr { get; set; }
    public string? Expertise { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? TwitterUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? PortfolioUrl { get; set; }
    public string? CvUrl { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? Timezone { get; set; }
    public UserRole Role { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; }
    public bool NotificationsEnabled { get; set; }
    public bool EmailNotifications { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string PreferredLanguage { get; set; } = "en";
    public int XpPoints { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateProfileDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? FirstNameAr { get; set; }
    public string? LastNameAr { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? BioAr { get; set; }
    public string? PreferredLanguage { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Expertise { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? TwitterUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? PortfolioUrl { get; set; }
    public string? CvUrl { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? Timezone { get; set; }
    public bool? NotificationsEnabled { get; set; }
    public bool? EmailNotifications { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class CreateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? FirstNameAr { get; set; }
    public string? LastNameAr { get; set; }
    public string? Phone { get; set; }
    public UserRole Role { get; set; } = UserRole.Student;
}
