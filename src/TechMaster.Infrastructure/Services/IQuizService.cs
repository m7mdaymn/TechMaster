using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Quiz;

namespace TechMaster.Infrastructure.Services;

public interface IQuizService
{
    Task<Result<QuizDto>> CreateQuizAsync(CreateQuizDto dto);
    Task<Result<QuizDetailDto>> GetQuizByIdAsync(Guid quizId, bool includeAnswers = false);
    Task<Result<List<QuizDto>>> GetSessionQuizzesAsync(Guid sessionId);
    Task<Result<List<QuizDto>>> GetCourseQuizzesAsync(Guid courseId);
    Task<Result<QuizDetailDto>> GetQuizBySessionAsync(Guid sessionId);
    Task<Result<QuizDto>> UpdateQuizAsync(Guid quizId, CreateQuizDto dto);
    Task<Result> DeleteQuizAsync(Guid quizId);
    Task<Result<QuizAttemptDto>> StartQuizAsync(Guid userId, Guid quizId);
    Task<Result<QuizResultDto>> SubmitQuizAsync(Guid userId, SubmitQuizDto dto);
    Task<Result<List<QuizAttemptDto>>> GetUserQuizAttemptsAsync(Guid userId, Guid quizId);
    Task<Result<List<QuestionDto>>> GetQuizQuestionsAsync(Guid quizId);
    Task<Result> UpdateQuizQuestionsAsync(Guid quizId, List<CreateQuestionDto> questions);
    Task<Result> AddQuestionAsync(Guid quizId, CreateQuestionDto dto);
    Task<Result> UpdateQuestionAsync(Guid questionId, CreateQuestionDto dto);
    Task<Result> DeleteQuestionAsync(Guid questionId);
}
