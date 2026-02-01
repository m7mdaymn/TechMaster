using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Gamification;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class GamificationController : BaseApiController
{
    private readonly IGamificationService _gamificationService;

    public GamificationController(IGamificationService gamificationService)
    {
        _gamificationService = gamificationService;
    }

    /// <summary>
    /// Get leaderboard with top users
    /// </summary>
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int count = 100, [FromQuery] string period = "all")
    {
        var result = await _gamificationService.GetLeaderboardAsync(count, period);
        return HandleResult(result);
    }

    /// <summary>
    /// Get user's rank in leaderboard
    /// </summary>
    [Authorize]
    [HttpGet("my-rank")]
    public async Task<IActionResult> GetMyRank()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _gamificationService.GetUserRankAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get user's XP and level (via badges)
    /// </summary>
    [Authorize]
    [HttpGet("my-progress")]
    public async Task<IActionResult> GetMyProgress()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        // Use GetUserBadgesAsync to get user progress
        var result = await _gamificationService.GetUserBadgesAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get user's badges
    /// </summary>
    [Authorize]
    [HttpGet("my-badges")]
    public async Task<IActionResult> GetMyBadges()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _gamificationService.GetUserBadgesAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get all available badges
    /// </summary>
    [HttpGet("badges")]
    public async Task<IActionResult> GetAllBadges()
    {
        var result = await _gamificationService.GetAvailableBadgesAsync();
        return HandleResult(result);
    }

    /// <summary>
    /// Create a badge (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("badges")]
    public async Task<IActionResult> CreateBadge([FromBody] CreateBadgeDto dto)
    {
        var result = await _gamificationService.CreateBadgeAsync(
            dto.NameEn,
            dto.NameAr,
            dto.Type,
            dto.IconUrl,
            dto.XpReward,
            dto.Criteria);
        return HandleResult(result);
    }

    /// <summary>
    /// Award XP to user (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("users/{userId:guid}/xp")]
    public async Task<IActionResult> AwardXp(Guid userId, [FromBody] AwardXpDto dto)
    {
        var result = await _gamificationService.AwardXpAsync(userId, dto.Points, dto.Reason);
        return HandleResult(result);
    }
}

public record AwardXpDto
{
    public int Points { get; init; }
    public string Reason { get; init; } = string.Empty;
}
