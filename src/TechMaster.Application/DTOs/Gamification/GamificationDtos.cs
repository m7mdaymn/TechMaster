using TechMaster.Domain.Enums;

namespace TechMaster.Application.DTOs.Gamification;

public class CreateBadgeDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public BadgeType Type { get; set; }
    public string IconUrl { get; set; } = string.Empty;
    public int XpReward { get; set; }
    public string? Criteria { get; set; }
}

public class UpdateBadgeDto
{
    public string? NameEn { get; set; }
    public string? NameAr { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public BadgeType? Type { get; set; }
    public string? IconUrl { get; set; }
    public int? XpReward { get; set; }
    public string? Criteria { get; set; }
    public bool? IsActive { get; set; }
}

public class UserXpDto
{
    public int TotalXp { get; set; }
    public int Level { get; set; }
    public int XpToNextLevel { get; set; }
    public int XpProgress { get; set; }
}

public class LeaderboardEntryDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public int TotalXp { get; set; }
    public int Level { get; set; }
    public int Rank { get; set; }
    public int BadgeCount { get; set; }
    public int CompletedCourses { get; set; }
}

public class LeaderboardDto
{
    public List<LeaderboardEntryDto> TopUsers { get; set; } = new();
    public int TotalParticipants { get; set; }
    public string Period { get; set; } = "all";
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class UserRankDto
{
    public int Rank { get; set; }
    public int TotalXp { get; set; }
    public int Level { get; set; }
    public int TotalParticipants { get; set; }
    public int XpToNextRank { get; set; }
    public LeaderboardEntryDto? NextUser { get; set; }
    public LeaderboardEntryDto? PreviousUser { get; set; }
}
