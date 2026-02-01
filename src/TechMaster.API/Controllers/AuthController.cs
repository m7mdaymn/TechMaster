using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Auth;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        return HandleAuthResponse(result);
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return HandleAuthResponse(result);
    }

    /// <summary>
    /// Refresh JWT token
    /// </summary>
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        var result = await _authService.RefreshTokenAsync(dto);
        return HandleAuthResponse(result);
    }

    /// <summary>
    /// Logout and revoke refresh token
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Logout is handled client-side by clearing tokens
        // Server-side token invalidation can be implemented if needed
        return Ok(new { Message = "Logged out successfully" });
    }

    /// <summary>
    /// Login with Google OAuth
    /// </summary>
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        var result = await _authService.GoogleLoginAsync(dto);
        return HandleAuthResponse(result);
    }

    /// <summary>
    /// Request password reset
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var result = await _authService.ForgotPasswordAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Reset password with token
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var result = await _authService.ResetPasswordAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _authService.GetUserByIdAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Update current user profile
    /// </summary>
    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _authService.UpdateProfileAsync(CurrentUserId.Value, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Change password
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _authService.ChangePasswordAsync(CurrentUserId.Value, dto);
        return HandleResult(result);
    }
}
