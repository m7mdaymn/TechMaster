using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Notification;
using TechMaster.Domain.Entities;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public NotificationService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result> CreateNotificationAsync(CreateNotificationDto dto)
    {
        var notification = _mapper.Map<Notification>(dto);
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return Result.Success("Notification created", "تم إنشاء الإشعار");
    }

    public async Task<Result<List<NotificationDto>>> GetUserNotificationsAsync(Guid userId, int count = 20)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(count)
            .ToListAsync();

        return Result<List<NotificationDto>>.Success(_mapper.Map<List<NotificationDto>>(notifications));
    }

    public async Task<Result<int>> GetUnreadCountAsync(Guid userId)
    {
        var count = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        return Result<int>.Success(count);
    }

    public async Task<Result> MarkAsReadAsync(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification == null)
        {
            return Result.Failure("Notification not found", "الإشعار غير موجود");
        }

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Result.Success("Marked as read", "تم وضع علامة مقروء");
    }

    public async Task<Result> MarkAllAsReadAsync(Guid userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Result.Success("All marked as read", "تم وضع علامة مقروء على الكل");
    }

    public async Task<Result> DeleteNotificationAsync(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification == null)
        {
            return Result.Failure("Notification not found", "الإشعار غير موجود");
        }

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return Result.Success("Notification deleted", "تم حذف الإشعار");
    }
}
