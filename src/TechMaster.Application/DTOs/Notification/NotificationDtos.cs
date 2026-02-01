using TechMaster.Domain.Enums;

namespace TechMaster.Application.DTOs.Notification;

public class NotificationDto
{
    public Guid Id { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string MessageEn { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string? ActionUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateNotificationDto
{
    public Guid UserId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string MessageEn { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string? ActionUrl { get; set; }
    public bool SendEmail { get; set; }
}
