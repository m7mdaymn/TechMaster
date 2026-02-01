using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TechMaster.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private static readonly Dictionary<string, HashSet<string>> _userConnections = new();
    private static readonly object _lock = new();

    public override Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId != null)
        {
            lock (_lock)
            {
                if (!_userConnections.ContainsKey(userId.Value.ToString()))
                {
                    _userConnections[userId.Value.ToString()] = new HashSet<string>();
                }
                _userConnections[userId.Value.ToString()].Add(Context.ConnectionId);
            }

            // Add to user-specific group for targeted notifications
            Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId != null)
        {
            lock (_lock)
            {
                if (_userConnections.TryGetValue(userId.Value.ToString(), out var connections))
                {
                    connections.Remove(Context.ConnectionId);
                    if (connections.Count == 0)
                    {
                        _userConnections.Remove(userId.Value.ToString());
                    }
                }
            }
        }

        return base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeToAdminNotifications()
    {
        var role = Context.User?.FindFirstValue(ClaimTypes.Role);
        if (role == "Admin")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
        }
    }

    public async Task SubscribeToInstructorNotifications()
    {
        var role = Context.User?.FindFirstValue(ClaimTypes.Role);
        if (role == "Instructor" || role == "Admin")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "instructors");
        }
    }

    public static async Task SendNotificationToUser(IHubContext<NotificationHub> hubContext, Guid userId, object notification)
    {
        await hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", notification);
    }

    public static async Task SendNotificationToAdmins(IHubContext<NotificationHub> hubContext, object notification)
    {
        await hubContext.Clients.Group("admins").SendAsync("ReceiveNotification", notification);
    }

    public static async Task SendNotificationToInstructors(IHubContext<NotificationHub> hubContext, object notification)
    {
        await hubContext.Clients.Group("instructors").SendAsync("ReceiveNotification", notification);
    }

    public static async Task SendNotificationToAll(IHubContext<NotificationHub> hubContext, object notification)
    {
        await hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
