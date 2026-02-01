using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Notification;

namespace TechMaster.Infrastructure.Services;

public interface INotificationService
{
    Task<Result> CreateNotificationAsync(CreateNotificationDto dto);
    Task<Result<List<NotificationDto>>> GetUserNotificationsAsync(Guid userId, int count = 20);
    Task<Result<int>> GetUnreadCountAsync(Guid userId);
    Task<Result> MarkAsReadAsync(Guid notificationId);
    Task<Result> MarkAllAsReadAsync(Guid userId);
    Task<Result> DeleteNotificationAsync(Guid notificationId);
}
