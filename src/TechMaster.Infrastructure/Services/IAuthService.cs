using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Auth;

namespace TechMaster.Infrastructure.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto dto);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto);
    Task<Result> VerifyEmailAsync(string token);
    Task<Result> ForgotPasswordAsync(ForgotPasswordDto dto);
    Task<Result> ResetPasswordAsync(ResetPasswordDto dto);
    Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
    Task<Result<UserDto>> GetUserByIdAsync(Guid userId);
    Task<Result<UserDto>> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
    Task<Result<PaginatedList<UserDto>>> GetUsersAsync(int pageNumber, int pageSize, string? role = null, string? search = null);
    Task<Result> UpdateUserRoleAsync(Guid userId, string role);
    Task<Result> DeactivateUserAsync(Guid userId);
    Task<Result> ActivateUserAsync(Guid userId);
}
