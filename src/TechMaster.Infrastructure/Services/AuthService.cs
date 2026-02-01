using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Auth;
using TechMaster.Domain.Entities;
using TechMaster.Domain.Enums;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IMapper mapper, IConfiguration configuration)
    {
        _context = context;
        _mapper = mapper;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());
        if (existingUser != null)
        {
            return new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Email already registered",
                MessageAr = "البريد الإلكتروني مسجل بالفعل"
            };
        }

        var user = new ApplicationUser
        {
            Email = dto.Email.ToLower(),
            PasswordHash = HashPassword(dto.Password),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            FirstNameAr = dto.FirstNameAr,
            LastNameAr = dto.LastNameAr,
            Phone = dto.Phone,
            Role = UserRole.Student,
            IsActive = true,
            IsEmailVerified = true // No email verification required
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            IsSuccess = true,
            Message = "Registration successful",
            MessageAr = "تم التسجيل بنجاح",
            Token = token,
            RefreshToken = refreshToken,
            TokenExpiry = DateTime.UtcNow.AddHours(24),
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());
        if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
        {
            return new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Invalid email or password",
                MessageAr = "البريد الإلكتروني أو كلمة المرور غير صحيحة"
            };
        }

        if (!user.IsActive)
        {
            return new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Account is deactivated",
                MessageAr = "الحساب معطل"
            };
        }

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            IsSuccess = true,
            Message = "Login successful",
            MessageAr = "تم تسجيل الدخول بنجاح",
            Token = token,
            RefreshToken = refreshToken,
            TokenExpiry = DateTime.UtcNow.AddHours(24),
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto dto)
    {
        try
        {
            // Validate the Google ID token
            var payload = await ValidateGoogleTokenAsync(dto.IdToken);
            
            if (payload == null)
            {
                return new AuthResponseDto
                {
                    IsSuccess = false,
                    Message = "Invalid Google token",
                    MessageAr = "رمز جوجل غير صالح"
                };
            }

            var email = payload.Email;
            var googleId = payload.Subject;
            var firstName = payload.GivenName ?? "User";
            var lastName = payload.FamilyName ?? "";
            var pictureUrl = payload.Picture;

            // Find existing user by Google ID or email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId || u.Email == email);

            if (user == null)
            {
                // Create new user - Google users are automatically verified
                user = new ApplicationUser
                {
                    Email = email,
                    GoogleId = googleId,
                    FirstName = firstName,
                    LastName = lastName,
                    ProfileImageUrl = pictureUrl,
                    PasswordHash = "", // No password for Google users
                    IsEmailVerified = true, // Google users are pre-verified
                    IsActive = true,
                    Role = UserRole.Student
                };

                await _context.Users.AddAsync(user);
            }
            else
            {
                // Update existing user's Google ID if not set
                if (string.IsNullOrEmpty(user.GoogleId))
                {
                    user.GoogleId = googleId;
                }
                // Also mark as verified since they authenticated with Google
                user.IsEmailVerified = true;
                
                // Update profile image if available and user doesn't have one
                if (string.IsNullOrEmpty(user.ProfileImageUrl) && !string.IsNullOrEmpty(pictureUrl))
                {
                    user.ProfileImageUrl = pictureUrl;
                }
            }

            // Generate tokens
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            user.LastLoginAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                IsSuccess = true,
                Message = "Login successful",
                MessageAr = "تم تسجيل الدخول بنجاح",
                Token = token,
                RefreshToken = refreshToken,
                TokenExpiry = DateTime.UtcNow.AddHours(24),
                User = _mapper.Map<UserDto>(user)
            };
        }
        catch (Exception ex)
        {
            return new AuthResponseDto
            {
                IsSuccess = false,
                Message = $"Google login failed: {ex.Message}",
                MessageAr = "فشل تسجيل الدخول عبر جوجل"
            };
        }
    }

    private async Task<Google.Apis.Auth.GoogleJsonWebSignature.Payload?> ValidateGoogleTokenAsync(string idToken)
    {
        try
        {
            var settings = new Google.Apis.Auth.GoogleJsonWebSignature.ValidationSettings
            {
                // You can specify your client ID here for extra security
                // Audience = new[] { _configuration["GoogleAuth:ClientId"] }
            };

            var payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            return payload;
        }
        catch
        {
            return null;
        }
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto)
    {
        var principal = GetPrincipalFromExpiredToken(dto.Token);
        if (principal == null)
        {
            return new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Invalid token",
                MessageAr = "رمز غير صالح"
            };
        }

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Invalid token",
                MessageAr = "رمز غير صالح"
            };
        }

        var user = await _context.Users.FindAsync(userGuid);
        if (user == null || user.RefreshToken != dto.RefreshToken || user.RefreshTokenExpiry <= DateTime.UtcNow)
        {
            return new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Invalid refresh token",
                MessageAr = "رمز التحديث غير صالح"
            };
        }

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            IsSuccess = true,
            Token = token,
            RefreshToken = refreshToken,
            TokenExpiry = DateTime.UtcNow.AddHours(24),
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<Result> VerifyEmailAsync(string token)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => 
            u.EmailVerificationToken == token && 
            u.EmailVerificationTokenExpiry > DateTime.UtcNow);

        if (user == null)
        {
            return Result.Failure("Invalid or expired token", "رمز غير صالح أو منتهي الصلاحية");
        }

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;
        await _context.SaveChangesAsync();

        return Result.Success("Email verified successfully", "تم التحقق من البريد الإلكتروني بنجاح");
    }

    public async Task<Result> ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());
        if (user == null)
        {
            return Result.Success("If the email exists, a reset link has been sent", 
                "إذا كان البريد الإلكتروني موجودًا، فقد تم إرسال رابط إعادة التعيين");
        }

        user.PasswordResetToken = GenerateToken();
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        await _context.SaveChangesAsync();

        // In production, send email with reset link
        return Result.Success("If the email exists, a reset link has been sent",
            "إذا كان البريد الإلكتروني موجودًا، فقد تم إرسال رابط إعادة التعيين");
    }

    public async Task<Result> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => 
            u.Email == dto.Email.ToLower() && 
            u.PasswordResetToken == dto.Token && 
            u.PasswordResetTokenExpiry > DateTime.UtcNow);

        if (user == null)
        {
            return Result.Failure("Invalid or expired token", "رمز غير صالح أو منتهي الصلاحية");
        }

        user.PasswordHash = HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await _context.SaveChangesAsync();

        return Result.Success("Password reset successfully", "تم إعادة تعيين كلمة المرور بنجاح");
    }

    public async Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found", "المستخدم غير موجود");
        }

        if (!VerifyPassword(dto.CurrentPassword, user.PasswordHash))
        {
            return Result.Failure("Current password is incorrect", "كلمة المرور الحالية غير صحيحة");
        }

        user.PasswordHash = HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return Result.Success("Password changed successfully", "تم تغيير كلمة المرور بنجاح");
    }

    public async Task<Result<UserDto>> GetUserByIdAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result<UserDto>.Failure("User not found", "المستخدم غير موجود");
        }

        return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
    }

    public async Task<Result<UserDto>> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result<UserDto>.Failure("User not found", "المستخدم غير موجود");
        }

        if (!string.IsNullOrEmpty(dto.FirstName)) user.FirstName = dto.FirstName;
        if (!string.IsNullOrEmpty(dto.LastName)) user.LastName = dto.LastName;
        if (dto.FirstNameAr != null) user.FirstNameAr = dto.FirstNameAr;
        if (dto.LastNameAr != null) user.LastNameAr = dto.LastNameAr;
        if (dto.Phone != null) user.Phone = dto.Phone;
        if (dto.Bio != null) user.Bio = dto.Bio;
        if (dto.BioAr != null) user.BioAr = dto.BioAr;
        if (!string.IsNullOrEmpty(dto.PreferredLanguage)) user.PreferredLanguage = dto.PreferredLanguage;
        if (dto.ProfileImageUrl != null) user.ProfileImageUrl = dto.ProfileImageUrl;
        if (dto.Expertise != null) user.Expertise = dto.Expertise;
        if (dto.LinkedInUrl != null) user.LinkedInUrl = dto.LinkedInUrl;
        if (dto.TwitterUrl != null) user.TwitterUrl = dto.TwitterUrl;
        if (dto.WebsiteUrl != null) user.WebsiteUrl = dto.WebsiteUrl;
        if (dto.GitHubUrl != null) user.GitHubUrl = dto.GitHubUrl;
        if (dto.PortfolioUrl != null) user.PortfolioUrl = dto.PortfolioUrl;
        if (dto.CvUrl != null) user.CvUrl = dto.CvUrl;
        if (dto.Country != null) user.Country = dto.Country;
        if (dto.City != null) user.City = dto.City;
        if (dto.Timezone != null) user.Timezone = dto.Timezone;
        if (dto.NotificationsEnabled.HasValue) user.NotificationsEnabled = dto.NotificationsEnabled.Value;
        if (dto.EmailNotifications.HasValue) user.EmailNotifications = dto.EmailNotifications.Value;

        await _context.SaveChangesAsync();

        return Result<UserDto>.Success(_mapper.Map<UserDto>(user), "Profile updated successfully", "تم تحديث الملف الشخصي بنجاح");
    }

    public async Task<Result<PaginatedList<UserDto>>> GetUsersAsync(int pageNumber, int pageSize, string? role = null, string? search = null)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var userRole))
        {
            query = query.Where(u => u.Role == userRole);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => 
                u.Email.Contains(search) || 
                u.FirstName.Contains(search) || 
                u.LastName.Contains(search));
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<PaginatedList<UserDto>>.Success(new PaginatedList<UserDto>
        {
            Items = _mapper.Map<List<UserDto>>(users),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    public async Task<Result> UpdateUserRoleAsync(Guid userId, string role)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found", "المستخدم غير موجود");
        }

        if (!Enum.TryParse<UserRole>(role, true, out var userRole))
        {
            return Result.Failure("Invalid role", "دور غير صالح");
        }

        user.Role = userRole;
        await _context.SaveChangesAsync();

        return Result.Success("Role updated successfully", "تم تحديث الدور بنجاح");
    }

    public async Task<Result> DeactivateUserAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found", "المستخدم غير موجود");
        }

        user.IsActive = false;
        await _context.SaveChangesAsync();

        return Result.Success("User deactivated successfully", "تم تعطيل المستخدم بنجاح");
    }

    public async Task<Result> ActivateUserAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found", "المستخدم غير موجود");
        }

        user.IsActive = true;
        await _context.SaveChangesAsync();

        return Result.Success("User activated successfully", "تم تفعيل المستخدم بنجاح");
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"] ?? "TechMasterSecretKey123456789012345678901234567890"));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("PreferredLanguage", user.PreferredLanguage)
        };

        var expirationMinutes = int.TryParse(_configuration["JwtSettings:ExpirationMinutes"], out var mins) ? mins : 60;
        
        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"] ?? "TechMaster",
            audience: _configuration["JwtSettings:Audience"] ?? "TechMasterUsers",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = false,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _configuration["JwtSettings:Issuer"] ?? "TechMaster",
            ValidAudience = _configuration["JwtSettings:Audience"] ?? "TechMasterUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"] ?? "TechMasterSecretKey123456789012345678901234567890"))
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }
            return principal;
        }
        catch
        {
            return null;
        }
    }

    private static string HashPassword(string password)
    {
        using var hmac = new HMACSHA512();
        var salt = hmac.Key;
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash);
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2) return false;
        
        var salt = Convert.FromBase64String(parts[0]);
        var hash = Convert.FromBase64String(parts[1]);
        
        using var hmac = new HMACSHA512(salt);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return computedHash.SequenceEqual(hash);
    }

    private static string GenerateToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }

    private static string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }
}
