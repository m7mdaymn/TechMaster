using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Quiz;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class QuizzesController : BaseApiController
{
    private readonly IQuizService _quizService;
    private readonly IProgressService _progressService;

    public QuizzesController(IQuizService quizService, IProgressService progressService)
    {
        _quizService = quizService;
        _progressService = progressService;
    }

    /// <summary>
    /// Get all quizzes for a course
    /// </summary>
    [Authorize]
    [HttpGet("course/{courseId:guid}")]
    public async Task<IActionResult> GetCourseQuizzes(Guid courseId)
    {
        var result = await _quizService.GetCourseQuizzesAsync(courseId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get quiz questions
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpGet("{quizId:guid}/questions")]
    public async Task<IActionResult> GetQuizQuestions(Guid quizId)
    {
        var result = await _quizService.GetQuizQuestionsAsync(quizId);
        return HandleResult(result);
    }

    /// <summary>
    /// Bulk update quiz questions
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPut("{quizId:guid}/questions")]
    public async Task<IActionResult> UpdateQuizQuestions(Guid quizId, [FromBody] List<CreateQuestionDto> questions)
    {
        var result = await _quizService.UpdateQuizQuestionsAsync(quizId, questions);
        return HandleResult(result);
    }

    /// <summary>
    /// Get quiz details
    /// </summary>
    [Authorize]
    [HttpGet("{quizId:guid}")]
    public async Task<IActionResult> GetQuiz(Guid quizId)
    {
        var result = await _quizService.GetQuizByIdAsync(quizId);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a quiz (Instructor/Admin only)
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPost]
    public async Task<IActionResult> CreateQuiz([FromBody] CreateQuizDto dto)
    {
        var result = await _quizService.CreateQuizAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Update a quiz (Instructor/Admin only)
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPut("{quizId:guid}")]
    public async Task<IActionResult> UpdateQuiz(Guid quizId, [FromBody] CreateQuizDto dto)
    {
        var result = await _quizService.UpdateQuizAsync(quizId, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a quiz (Instructor/Admin only)
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpDelete("{quizId:guid}")]
    public async Task<IActionResult> DeleteQuiz(Guid quizId)
    {
        var result = await _quizService.DeleteQuizAsync(quizId);
        return HandleResult(result);
    }

    /// <summary>
    /// Add a question to a quiz
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPost("{quizId:guid}/questions")]
    public async Task<IActionResult> AddQuestion(Guid quizId, [FromBody] CreateQuestionDto dto)
    {
        var result = await _quizService.AddQuestionAsync(quizId, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Update a question
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPut("questions/{questionId:guid}")]
    public async Task<IActionResult> UpdateQuestion(Guid questionId, [FromBody] CreateQuestionDto dto)
    {
        var result = await _quizService.UpdateQuestionAsync(questionId, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a question
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpDelete("questions/{questionId:guid}")]
    public async Task<IActionResult> DeleteQuestion(Guid questionId)
    {
        var result = await _quizService.DeleteQuestionAsync(questionId);
        return HandleResult(result);
    }

    /// <summary>
    /// Start a quiz attempt
    /// </summary>
    [Authorize]
    [HttpPost("{quizId:guid}/start")]
    public async Task<IActionResult> StartQuiz(Guid quizId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _quizService.StartQuizAsync(CurrentUserId.Value, quizId);
        return HandleResult(result);
    }

    /// <summary>
    /// Submit quiz answers and complete attempt
    /// </summary>
    [Authorize]
    [HttpPost("attempts/{attemptId:guid}/submit")]
    public async Task<IActionResult> SubmitQuiz(Guid attemptId, [FromBody] SubmitQuizDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        dto.AttemptId = attemptId;
        var result = await _quizService.SubmitQuizAsync(CurrentUserId.Value, dto);
        if (result.IsSuccess && result.Data != null)
        {
            // Update session progress if quiz is passed
            if (result.Data.IsPassed && result.Data.SessionId.HasValue)
            {
                await _progressService.MarkQuizPassedAsync(CurrentUserId.Value, result.Data.SessionId.Value, result.Data.Score);
            }
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Get user's quiz attempts
    /// </summary>
    [Authorize]
    [HttpGet("{quizId:guid}/my-attempts")]
    public async Task<IActionResult> GetMyAttempts(Guid quizId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _quizService.GetUserQuizAttemptsAsync(CurrentUserId.Value, quizId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get quiz by session ID
    /// </summary>
    [Authorize]
    [HttpGet("session/{sessionId:guid}")]
    public async Task<IActionResult> GetQuizBySession(Guid sessionId)
    {
        var result = await _quizService.GetQuizBySessionAsync(sessionId);
        return HandleResult(result);
    }

    /// <summary>
    /// Submit quiz directly (combines start and submit for simpler flow)
    /// </summary>
    [Authorize]
    [HttpPost("{quizId:guid}/submit")]
    public async Task<IActionResult> SubmitQuizDirect(Guid quizId, [FromBody] SubmitQuizDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        // Start the attempt first
        var startResult = await _quizService.StartQuizAsync(CurrentUserId.Value, quizId);
        if (!startResult.IsSuccess || startResult.Data == null)
        {
            return HandleResult(startResult);
        }

        // Submit the answers
        dto.AttemptId = startResult.Data.Id;
        var result = await _quizService.SubmitQuizAsync(CurrentUserId.Value, dto);
        if (result.IsSuccess && result.Data != null)
        {
            // Update session progress if quiz is passed
            if (result.Data.IsPassed && result.Data.SessionId.HasValue)
            {
                await _progressService.MarkQuizPassedAsync(CurrentUserId.Value, result.Data.SessionId.Value, result.Data.Score);
            }
        }
        return HandleResult(result);
    }
}
