using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private static readonly Dictionary<string, HashSet<string>> _userConnections = new();
    private static readonly object _lock = new();

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public override async Task OnConnectedAsync()
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

            // Join all user's chat rooms
            var roomsResult = await _chatService.GetUserChatRoomsAsync(userId.Value);
            if (roomsResult.IsSuccess && roomsResult.Data != null)
            {
                foreach (var room in roomsResult.Data)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, room.Id.ToString());
                }
            }

            await Clients.Caller.SendAsync("Connected", new { ConnectionId = Context.ConnectionId });
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
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

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(Guid roomId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        // Verify user is a member of the room by trying to get it
        var roomResult = await _chatService.GetChatRoomAsync(roomId, userId.Value);
        if (roomResult.IsSuccess && roomResult.Data != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());
            await Clients.Caller.SendAsync("JoinedRoom", roomId);
        }
    }

    public async Task LeaveRoom(Guid roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId.ToString());
        await Clients.Caller.SendAsync("LeftRoom", roomId);
    }

    public async Task SendMessage(Guid roomId, string content)
    {
        var userId = GetUserId();
        if (userId == null) return;

        var messageDto = new TechMaster.Application.DTOs.Chat.SendMessageDto
        {
            ChatRoomId = roomId,
            Content = content
        };
        var result = await _chatService.SendMessageAsync(userId.Value, messageDto);
        if (result.IsSuccess && result.Data != null)
        {
            await Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", result.Data);
        }
    }

    public async Task MarkAsRead(Guid roomId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        await _chatService.MarkAsReadAsync(userId.Value, roomId);
        await Clients.Caller.SendAsync("MessagesRead", roomId);
    }

    public async Task StartTyping(Guid roomId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        var userName = Context.User?.FindFirstValue(ClaimTypes.Name) ?? "User";
        await Clients.OthersInGroup(roomId.ToString()).SendAsync("UserTyping", new
        {
            RoomId = roomId,
            UserId = userId.Value,
            UserName = userName
        });
    }

    public async Task StopTyping(Guid roomId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        await Clients.OthersInGroup(roomId.ToString()).SendAsync("UserStoppedTyping", new
        {
            RoomId = roomId,
            UserId = userId.Value
        });
    }

    public static bool IsUserOnline(Guid userId)
    {
        lock (_lock)
        {
            return _userConnections.ContainsKey(userId.ToString());
        }
    }

    public static IEnumerable<string> GetUserConnectionIds(Guid userId)
    {
        lock (_lock)
        {
            if (_userConnections.TryGetValue(userId.ToString(), out var connections))
            {
                return connections.ToList();
            }
            return Enumerable.Empty<string>();
        }
    }

    private Guid? GetUserId()
    {
        var userIdClaim = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
