using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Quiz;
using TechMaster.Domain.Entities;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class QuizService : IQuizService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IProgressService _progressService;

    public QuizService(ApplicationDbContext context, IMapper mapper, IProgressService progressService)
    {
        _context = context;
        _mapper = mapper;
        _progressService = progressService;
    }

    public async Task<Result<QuizDto>> CreateQuizAsync(CreateQuizDto dto)
    {
        var quiz = _mapper.Map<Quiz>(dto);
        _context.Quizzes.Add(quiz);

        if (dto.Questions != null && dto.Questions.Any())
        {
            foreach (var questionDto in dto.Questions)
            {
                var question = _mapper.Map<Question>(questionDto);
                question.QuizId = quiz.Id;
                _context.Questions.Add(question);

                foreach (var optionDto in questionDto.Options)
                {
                    var option = _mapper.Map<QuestionOption>(optionDto);
                    option.QuestionId = question.Id;
                    _context.QuestionOptions.Add(option);
                }
            }
        }

        await _context.SaveChangesAsync();

        return Result<QuizDto>.Success(_mapper.Map<QuizDto>(quiz), "Quiz created successfully", "تم إنشاء الاختبار بنجاح");
    }

    public async Task<Result<QuizDetailDto>> GetQuizByIdAsync(Guid quizId, bool includeAnswers = false)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions.Where(qu => qu.IsActive).OrderBy(qu => qu.SortOrder))
                .ThenInclude(qu => qu.Options.OrderBy(o => o.SortOrder))
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
        {
            return Result<QuizDetailDto>.Failure("Quiz not found", "الاختبار غير موجود");
        }

        var dto = _mapper.Map<QuizDetailDto>(quiz);

        // Remove correct answers if not requested
        if (!includeAnswers)
        {
            foreach (var question in dto.Questions)
            {
                foreach (var option in question.Options)
                {
                    option.IsCorrect = false;
                }
            }
        }

        return Result<QuizDetailDto>.Success(dto);
    }

    public async Task<Result<List<QuizDto>>> GetSessionQuizzesAsync(Guid sessionId)
    {
        var quizzes = await _context.Quizzes
            .Include(q => q.Questions)
            .Where(q => q.SessionId == sessionId && q.IsActive)
            .ToListAsync();

        return Result<List<QuizDto>>.Success(_mapper.Map<List<QuizDto>>(quizzes));
    }

    public async Task<Result<QuizDetailDto>> GetQuizBySessionAsync(Guid sessionId)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions.OrderBy(qu => qu.SortOrder))
                .ThenInclude(q => q.Options.OrderBy(o => o.SortOrder))
            .FirstOrDefaultAsync(q => q.SessionId == sessionId && q.IsActive);

        if (quiz == null)
        {
            return Result<QuizDetailDto>.Failure("Quiz not found for this session", "الاختبار غير موجود لهذه الجلسة");
        }

        var dto = _mapper.Map<QuizDetailDto>(quiz);
        // Don't include correct answers for students
        if (dto.Questions != null)
        {
            foreach (var question in dto.Questions)
            {
                if (question.Options != null)
                {
                    foreach (var option in question.Options)
                    {
                        option.IsCorrect = false; // Hide correct answers from students
                    }
                }
            }
        }

        return Result<QuizDetailDto>.Success(dto);
    }

    public async Task<Result<List<QuizDto>>> GetCourseQuizzesAsync(Guid courseId)
    {
        var quizzes = await _context.Quizzes
            .Include(q => q.Questions)
            .Where(q => q.CourseId == courseId && q.IsActive)
            .ToListAsync();

        return Result<List<QuizDto>>.Success(_mapper.Map<List<QuizDto>>(quizzes));
    }

    public async Task<Result<QuizDto>> UpdateQuizAsync(Guid quizId, CreateQuizDto dto)
    {
        var quiz = await _context.Quizzes.FindAsync(quizId);
        if (quiz == null)
        {
            return Result<QuizDto>.Failure("Quiz not found", "الاختبار غير موجود");
        }

        quiz.NameEn = dto.NameEn;
        quiz.NameAr = dto.NameAr;
        quiz.DescriptionEn = dto.DescriptionEn;
        quiz.DescriptionAr = dto.DescriptionAr;
        quiz.TimeLimit = dto.TimeLimit;
        quiz.PassingScore = dto.PassingScore;
        quiz.MaxAttempts = dto.MaxAttempts;
        quiz.ShuffleQuestions = dto.ShuffleQuestions;
        quiz.ShuffleOptions = dto.ShuffleOptions;
        quiz.ShowCorrectAnswers = dto.ShowCorrectAnswers;

        await _context.SaveChangesAsync();

        return Result<QuizDto>.Success(_mapper.Map<QuizDto>(quiz), "Quiz updated successfully", "تم تحديث الاختبار بنجاح");
    }

    public async Task<Result> DeleteQuizAsync(Guid quizId)
    {
        var quiz = await _context.Quizzes.FindAsync(quizId);
        if (quiz == null)
        {
            return Result.Failure("Quiz not found", "الاختبار غير موجود");
        }

        _context.Quizzes.Remove(quiz);
        await _context.SaveChangesAsync();

        return Result.Success("Quiz deleted successfully", "تم حذف الاختبار بنجاح");
    }

    public async Task<Result<QuizAttemptDto>> StartQuizAsync(Guid userId, Guid quizId)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
        {
            return Result<QuizAttemptDto>.Failure("Quiz not found", "الاختبار غير موجود");
        }

        // Check attempt limit
        var previousAttempts = await _context.QuizAttempts
            .CountAsync(a => a.UserId == userId && a.QuizId == quizId);

        if (previousAttempts >= quiz.MaxAttempts)
        {
            return Result<QuizAttemptDto>.Failure("Maximum attempts reached", "تم الوصول للحد الأقصى من المحاولات");
        }

        var attempt = new QuizAttempt
        {
            UserId = userId,
            QuizId = quizId,
            StartedAt = DateTime.UtcNow,
            AttemptNumber = previousAttempts + 1,
            TotalQuestions = quiz.Questions.Count,
            TotalPoints = quiz.Questions.Sum(q => q.Points)
        };

        _context.QuizAttempts.Add(attempt);
        await _context.SaveChangesAsync();

        return Result<QuizAttemptDto>.Success(_mapper.Map<QuizAttemptDto>(attempt));
    }

    public async Task<Result<QuizResultDto>> SubmitQuizAsync(Guid userId, SubmitQuizDto dto)
    {
        var attempt = await _context.QuizAttempts
            .Include(a => a.Quiz)
                .ThenInclude(q => q.Questions)
                    .ThenInclude(qu => qu.Options)
            .FirstOrDefaultAsync(a => a.Id == dto.AttemptId && a.UserId == userId);

        if (attempt == null)
        {
            return Result<QuizResultDto>.Failure("Attempt not found", "المحاولة غير موجودة");
        }

        if (attempt.CompletedAt != null)
        {
            return Result<QuizResultDto>.Failure("Quiz already submitted", "تم إرسال الاختبار بالفعل");
        }

        // Check time limit
        if (attempt.Quiz.TimeLimit > 0)
        {
            var timeLimitMinutes = attempt.Quiz.TimeLimit;
            var timeElapsed = DateTime.UtcNow - attempt.StartedAt;
            if (timeElapsed.TotalMinutes > timeLimitMinutes + 1) // 1 minute grace
            {
                return Result<QuizResultDto>.Failure("Time limit exceeded", "تم تجاوز الوقت المحدد");
            }
        }

        var score = 0;
        var correctAnswers = 0;
        var questionResults = new List<QuestionResultDto>();

        foreach (var answer in dto.Answers)
        {
            var question = attempt.Quiz.Questions.FirstOrDefault(q => q.Id == answer.QuestionId);
            if (question == null) continue;

            var selectedOption = question.Options.FirstOrDefault(o => o.Id == answer.SelectedOptionId);
            var correctOption = question.Options.FirstOrDefault(o => o.IsCorrect);
            var isCorrect = selectedOption?.IsCorrect ?? false;

            var pointsEarned = isCorrect ? question.Points : 0;
            if (isCorrect)
            {
                score += pointsEarned;
                correctAnswers++;
            }

            var questionAnswer = new QuestionAnswer
            {
                AttemptId = attempt.Id,
                QuestionId = question.Id,
                SelectedOptionId = answer.SelectedOptionId,
                IsCorrect = isCorrect,
                PointsEarned = pointsEarned
            };
            _context.QuestionAnswers.Add(questionAnswer);

            if (attempt.Quiz.ShowCorrectAnswers)
            {
                questionResults.Add(new QuestionResultDto
                {
                    QuestionId = question.Id,
                    QuestionText = question.QuestionTextEn,
                    IsCorrect = isCorrect,
                    PointsEarned = pointsEarned,
                    SelectedOptionId = answer.SelectedOptionId,
                    CorrectOptionId = correctOption?.Id,
                    Explanation = question.ExplanationEn
                });
            }
        }

        attempt.Score = score;
        attempt.CorrectAnswers = correctAnswers;
        attempt.CompletedAt = DateTime.UtcNow;
        attempt.TimeSpentSeconds = (int)(attempt.CompletedAt.Value - attempt.StartedAt).TotalSeconds;
        attempt.IsPassed = (score * 100.0 / attempt.TotalPoints) >= attempt.Quiz.PassingScore;

        await _context.SaveChangesAsync();

        // Update session progress if this is a session quiz
        if (attempt.Quiz.SessionId.HasValue && attempt.IsPassed)
        {
            await _progressService.MarkQuizPassedAsync(userId, attempt.Quiz.SessionId.Value, score);
        }

        var result = new QuizResultDto
        {
            AttemptId = attempt.Id,
            Score = score,
            TotalPoints = attempt.TotalPoints,
            CorrectAnswers = correctAnswers,
            TotalQuestions = attempt.TotalQuestions,
            IsPassed = attempt.IsPassed,
            TimeSpentSeconds = attempt.TimeSpentSeconds,
            ScorePercentage = attempt.TotalPoints > 0 ? (score * 100.0 / attempt.TotalPoints) : 0,
            QuestionResults = attempt.Quiz.ShowCorrectAnswers ? questionResults : null
        };

        return Result<QuizResultDto>.Success(result);
    }

    public async Task<Result<List<QuizAttemptDto>>> GetUserQuizAttemptsAsync(Guid userId, Guid quizId)
    {
        var attempts = await _context.QuizAttempts
            .Include(a => a.Quiz)
            .Where(a => a.UserId == userId && a.QuizId == quizId)
            .OrderByDescending(a => a.StartedAt)
            .ToListAsync();

        return Result<List<QuizAttemptDto>>.Success(_mapper.Map<List<QuizAttemptDto>>(attempts));
    }

    public async Task<Result<List<QuestionDto>>> GetQuizQuestionsAsync(Guid quizId)
    {
        var quiz = await _context.Quizzes.FindAsync(quizId);
        if (quiz == null)
        {
            return Result<List<QuestionDto>>.Failure("Quiz not found", "الاختبار غير موجود");
        }

        var questions = await _context.Questions
            .Include(q => q.Options)
            .Where(q => q.QuizId == quizId)
            .OrderBy(q => q.SortOrder)
            .ToListAsync();

        return Result<List<QuestionDto>>.Success(_mapper.Map<List<QuestionDto>>(questions));
    }

    public async Task<Result> UpdateQuizQuestionsAsync(Guid quizId, List<CreateQuestionDto> questions)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
        {
            return Result.Failure("Quiz not found", "الاختبار غير موجود");
        }

        // Remove existing questions and options
        foreach (var existingQuestion in quiz.Questions.ToList())
        {
            _context.QuestionOptions.RemoveRange(existingQuestion.Options);
            _context.Questions.Remove(existingQuestion);
        }

        // Add new questions
        int sortOrder = 0;
        foreach (var dto in questions)
        {
            var question = _mapper.Map<Question>(dto);
            question.QuizId = quizId;
            question.SortOrder = sortOrder++;
            _context.Questions.Add(question);

            foreach (var optionDto in dto.Options)
            {
                var option = _mapper.Map<QuestionOption>(optionDto);
                option.QuestionId = question.Id;
                _context.QuestionOptions.Add(option);
            }
        }

        await _context.SaveChangesAsync();

        return Result.Success("Quiz questions updated successfully", "تم تحديث أسئلة الاختبار بنجاح");
    }

    public async Task<Result> AddQuestionAsync(Guid quizId, CreateQuestionDto dto)
    {
        var quiz = await _context.Quizzes.FindAsync(quizId);
        if (quiz == null)
        {
            return Result.Failure("Quiz not found", "الاختبار غير موجود");
        }

        var question = _mapper.Map<Question>(dto);
        question.QuizId = quizId;
        _context.Questions.Add(question);

        foreach (var optionDto in dto.Options)
        {
            var option = _mapper.Map<QuestionOption>(optionDto);
            option.QuestionId = question.Id;
            _context.QuestionOptions.Add(option);
        }

        await _context.SaveChangesAsync();

        return Result.Success("Question added successfully", "تم إضافة السؤال بنجاح");
    }

    public async Task<Result> UpdateQuestionAsync(Guid questionId, CreateQuestionDto dto)
    {
        var question = await _context.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == questionId);

        if (question == null)
        {
            return Result.Failure("Question not found", "السؤال غير موجود");
        }

        question.QuestionTextEn = dto.QuestionTextEn;
        question.QuestionTextAr = dto.QuestionTextAr;
        question.ExplanationEn = dto.ExplanationEn;
        question.ExplanationAr = dto.ExplanationAr;
        question.Points = dto.Points;
        question.SortOrder = dto.SortOrder;

        // Remove old options and add new ones
        _context.QuestionOptions.RemoveRange(question.Options);

        foreach (var optionDto in dto.Options)
        {
            var option = _mapper.Map<QuestionOption>(optionDto);
            option.QuestionId = question.Id;
            _context.QuestionOptions.Add(option);
        }

        await _context.SaveChangesAsync();

        return Result.Success("Question updated successfully", "تم تحديث السؤال بنجاح");
    }

    public async Task<Result> DeleteQuestionAsync(Guid questionId)
    {
        var question = await _context.Questions.FindAsync(questionId);
        if (question == null)
        {
            return Result.Failure("Question not found", "السؤال غير موجود");
        }

        _context.Questions.Remove(question);
        await _context.SaveChangesAsync();

        return Result.Success("Question deleted successfully", "تم حذف السؤال بنجاح");
    }
}
