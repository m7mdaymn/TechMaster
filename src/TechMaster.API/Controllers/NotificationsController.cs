using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Notification;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class NotificationsController : BaseApiController
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary>
    /// Get user's notifications
    /// </summary>
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int count = 20)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _notificationService.GetUserNotificationsAsync(CurrentUserId.Value, count);
        return HandleResult(result);
    }

    /// <summary>
    /// Get unread notification count
    /// </summary>
    [Authorize]
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _notificationService.GetUnreadCountAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [Authorize]
    [HttpPost("{notificationId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId)
    {
        var result = await _notificationService.MarkAsReadAsync(notificationId);
        return HandleResult(result);
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [Authorize]
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _notificationService.MarkAllAsReadAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [Authorize]
    [HttpDelete("{notificationId:guid}")]
    public async Task<IActionResult> DeleteNotification(Guid notificationId)
    {
        var result = await _notificationService.DeleteNotificationAsync(notificationId);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a notification (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto dto)
    {
        var result = await _notificationService.CreateNotificationAsync(dto);
        return HandleResult(result);
    }

}
