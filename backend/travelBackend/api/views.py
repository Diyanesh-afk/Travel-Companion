import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import JsonResponse, request
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods


from .models import (
    Profile,
    Destination,
    Story,
    StoryMedia,
    StoryLike,
    StorySave,
    Comment,
    Question,
    Answer,
    Trip,
    Follow,
)


def body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}


def error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def ensure_profile(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def require_user(request):
    return request.user if request.user.is_authenticated else None


def user_json(user):
    profile = ensure_profile(user)
    name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
    initials = "".join(part[0].upper() for part in name.split() if part)[:2]
    return {
        "id": user.id,
        "username": user.username,
        "name": name,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "location": profile.location,
        "bio": profile.bio,
        "initials": initials or user.username[:1].upper(),
        "states": profile.states_explored,
        "countries": profile.countries_explored,
        "followers": Follow.objects.filter(following=user).count(),
        "following": Follow.objects.filter(follower=user).count(),
        "stories": Story.objects.filter(author=user).count(),
        "is_staff": user.is_staff,
    }


def story_json(story, request_user=None, request=None):
    liked = saved = False
    is_owner = bool(request_user and request_user.is_authenticated and story.author_id == request_user.id)
    if request_user and request_user.is_authenticated:
        liked = StoryLike.objects.filter(story=story, user=request_user).exists()
        saved = StorySave.objects.filter(story=story, user=request_user).exists()
    return {
        "id": story.id,
        "author": user_json(story.author),
        "location": story.location,
        "title": story.title,
        "excerpt": story.excerpt,
        "body": story.body,
        "category": story.category,
        "type": story.story_type,
        "tags": story.tags or [],
        "readTime": story.read_time,
        "thumbnail": story.thumbnail,
"media": [
    {
        "id": media.id,
        "url": (
            request.build_absolute_uri(
                media.file.url
            )
            if request
            else media.file.url
        ),
        "type": media.media_type,
    }
    for media in story.media.all()
],

        "likes": story.like_count,
        "comments": story.comment_count,
        "saves": story.save_count,
        "liked": liked,
        "saved": saved,
        "isOwner": is_owner,
        "createdAt": story.created_at.isoformat(),
    }


def destination_json(destination):
    text = " ".join([
        destination.name,
        destination.state,
        destination.tag,
        destination.description,
    ]).lower()
    categories = []
    if any(x in text for x in ["hotel", "stay", "resort", "accommodation"]):
        categories.append("Hotels")
    if any(x in text for x in ["beach", "heritage", "hill", "tea", "offbeat", "spot"]):
        categories.append("Spots")
    if destination.budget:
        categories.append("Budget")
    if any(x in text for x in ["activity", "adventure", "waterfall", "scooter"]):
        categories.append("Fun Activities")
    if any(x in text for x in ["road", "roads", "driving"]):
        categories.append("Road Trips")
    if any(x in text for x in ["trek", "hike", "mountain", "high-altitude"]):
        categories.append("Hikes")

    return {
        "id": destination.id,
        "name": destination.name,
        "state": destination.state,
        "tag": destination.tag,
        "category": destination.tag,
        "categories": categories,
        "emoji": destination.emoji,
        "color": destination.color,
        "duration": destination.duration,
        "budget": destination.budget,
        "description": destination.description,
    }


def question_json(question, request_user=None):
    is_owner = bool(request_user and request_user.is_authenticated and question.author_id == request_user.id)
    return {
        "id": question.id,
        "title": question.title,
        "body": question.body,
        "category": question.category,
        "author": user_json(question.author),
        "solved": question.solved,
        "views": question.views,
        "answers": question.answers.count(),
        "isOwner": is_owner,
        "createdAt": question.created_at.isoformat(),
    }


@require_http_methods(["GET"])
def health(request):
    return JsonResponse({"status": "ok", "database": "mysql"})


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    data = body(request)
    username = str(data.get("username", "")).strip()
    password = data.get("password", "")
    email = str(data.get("email", "")).strip()
    first_name = str(data.get("first_name", "")).strip()
    last_name = str(data.get("last_name", "")).strip()
    if not username or not password:
        return error("Username and password are required.")
    if User.objects.filter(username=username).exists():
        return error("Username already exists.")
    if len(password) < 8:
        return error("Password must be at least 8 characters.")
    user = User.objects.create_user(username, email, password, first_name=first_name, last_name=last_name)
    profile = ensure_profile(user)
    profile.location = data.get("location", "")
    profile.bio = data.get("bio", "")
    profile.save()
    login(request, user)
    return JsonResponse({"user": user_json(user)}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def login_api(request):
    data = body(request)
    user = authenticate(username=str(data.get("username", "")).strip(), password=data.get("password", ""))
    if user is None:
        return error("Invalid username or password.", 401)
    login(request, user)
    return JsonResponse({"user": user_json(user)})


@csrf_exempt
@require_http_methods(["POST"])
def logout_api(request):
    logout(request)
    return JsonResponse({"ok": True})


@ensure_csrf_cookie
@require_http_methods(["GET"])
def me(request):
    user = require_user(request)

    if not user:
        return error("Not authenticated.", 401)

    return JsonResponse({
        "user": user_json(user)
    })

@csrf_exempt
@csrf_exempt
@require_http_methods(["PUT"])
def update_profile(request):
    user = require_user(request)
    if not user:
        return error("Login required.", 401)
    data = body(request)
    profile = ensure_profile(user)
    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    user.email = data.get("email", user.email)
    user.save()
    profile.location = data.get("location", profile.location)
    profile.bio = data.get("bio", profile.bio)
    try:
        profile.states_explored = int(data.get("states", profile.states_explored) or 0)
        profile.countries_explored = int(data.get("countries", profile.countries_explored) or 0)
    except (TypeError, ValueError):
        return error("States and countries must be numbers.")
    profile.save()
    return JsonResponse({"user": user_json(user)})


@require_http_methods(["GET"])
def home(request):
    stories = Story.objects.all()[:6]
    questions = Question.objects.all()[:5]
    destinations = Destination.objects.all()[:8]
    return JsonResponse({
        "stories": [story_json(s, request.user) for s in stories],
        "questions": [question_json(q, request.user) for q in questions],
        "destinations": [destination_json(d) for d in destinations],
    })


@require_http_methods(["GET"])
def destinations(request):
    items = Destination.objects.all()
    query = request.GET.get("q", "").strip()
    tag = request.GET.get("tag", "").strip()
    if query:
        items = items.filter(
            Q(name__icontains=query)
            | Q(state__icontains=query)
            | Q(tag__icontains=query)
            | Q(description__icontains=query)
        )
    if tag and tag.lower() != "all":
        def matches(d):
            return tag.lower() in [c.lower() for c in destination_json(d)["categories"]]
        items = [d for d in items if matches(d)]
    return JsonResponse({"items": [destination_json(d) for d in items]})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def stories(request):

    # -----------------------------------------------------
    # GET STORIES
    # -----------------------------------------------------

    if request.method == "GET":

        queryset = Story.objects.all()

        category = request.GET.get(
            "category",
            ""
        ).strip()

        if category and category.lower() != "all":
            queryset = queryset.filter(
                Q(category__iexact=category)
                | Q(tags__icontains=category)
            )

        queryset = queryset.order_by(
            "-created_at"
        )

        return JsonResponse({
            "items": [
                story_json(
                    story,
                    request.user,
                    request
                )
                for story in queryset
            ]
        })

    # -----------------------------------------------------
    # CREATE STORY
    # -----------------------------------------------------

    user = require_user(request)

    if not user:
        return error(
            "Login required.",
            401
        )

    title = request.POST.get(
        "title",
        ""
    ).strip()

    location = request.POST.get(
        "location",
        ""
    ).strip()

    body_text = request.POST.get(
        "body",
        ""
    ).strip()

    category = request.POST.get(
        "category",
        ""
    ).strip()

    story_type = request.POST.get(
        "story_type",
        "Story"
    ).strip()

    tags_text = request.POST.get(
        "tags",
        ""
    ).strip()

    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    if not title:
        return error(
            "Story title is required."
        )

    if not body_text:
        return error(
            "Please write something about your trip."
        )

    # -----------------------------------------------------
    # TAGS
    # -----------------------------------------------------

    tags = [
        tag.strip()
        for tag in tags_text.split(",")
        if tag.strip()
    ]

    # -----------------------------------------------------
    # CREATE STORY
    # -----------------------------------------------------

    story = Story.objects.create(
        author=user,
        title=title,
        location=location,
        excerpt=body_text[:180],
        body=body_text,
        category=category,
        story_type=story_type,
        tags=tags,
    )

    # -----------------------------------------------------
    # UPLOAD PHOTOS / VIDEOS
    # -----------------------------------------------------

    uploaded_files = request.FILES.getlist(
        "media"
    )

    for uploaded_file in uploaded_files:

        content_type = (
            uploaded_file.content_type or ""
        ).lower()

        if content_type.startswith("image/"):
            media_type = "image"

        elif content_type.startswith("video/"):
            media_type = "video"

        else:
            continue

        StoryMedia.objects.create(
            story=story,
            file=uploaded_file,
            media_type=media_type
        )

    return JsonResponse(
        {
            "message": "Story published successfully.",
            "story": story_json(
                story,
                request.user
            )
        },
        status=201
    )


@csrf_exempt
@require_http_methods(["POST"])
def story_like(request, pk):
    user = require_user(request)
    if not user: return error("Login required.", 401)
    try: story = Story.objects.get(pk=pk)
    except Story.DoesNotExist: return error("Story not found.", 404)
    like = StoryLike.objects.filter(story=story, user=user).first()
    if like:
        like.delete(); liked = False
    else:
        StoryLike.objects.create(story=story, user=user); liked = True
    return JsonResponse({"liked": liked, "likes": story.like_count})


@csrf_exempt
@require_http_methods(["POST"])
def story_save(request, pk):
    user = require_user(request)
    if not user: return error("Login required.", 401)
    try: story = Story.objects.get(pk=pk)
    except Story.DoesNotExist: return error("Story not found.", 404)
    saved_item = StorySave.objects.filter(story=story, user=user).first()
    if saved_item:
        saved_item.delete(); saved = False
    else:
        StorySave.objects.create(story=story, user=user); saved = True
    return JsonResponse({"saved": saved, "saves": story.save_count})


@csrf_exempt
@require_http_methods(["POST"])
def story_comment(request, pk):
    user = require_user(request)
    if not user: return error("Login required.", 401)
    text = str(body(request).get("text", "")).strip()
    if not text: return error("Comment cannot be empty.")
    try: story = Story.objects.get(pk=pk)
    except Story.DoesNotExist: return error("Story not found.", 404)
    comment = Comment.objects.create(story=story, author=user, text=text)
    return JsonResponse({"comment": {"id": comment.id, "author": user_json(user), "text": comment.text, "createdAt": comment.created_at.isoformat(), "isOwner": True}, "comments": story.comment_count}, status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
def comment_detail(request, pk):
    user = require_user(request)
    if not user:
        return error("Login required.", 401)
    try:
        comment = Comment.objects.get(pk=pk)
    except Comment.DoesNotExist:
        return error("Comment not found.", 404)
    if comment.author_id != user.id and not user.is_staff:
        return error("You can only delete your own comment.", 403)
    comment.delete()
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["DELETE"])
def story_delete(request, pk):
    user = require_user(request)
    if not user:
        return error("Login required.", 401)
    try:
        story = Story.objects.get(pk=pk)
    except Story.DoesNotExist:
        return error("Story not found.", 404)
    if story.author_id != user.id and not user.is_staff:
        return error("You can only delete your own story.", 403)
    media_files = list(story.media.all())
    story.delete()
    for media in media_files:
        try:
            media.file.delete(save=False)
        except Exception:
            pass
    return JsonResponse({"ok": True})


@require_http_methods(["GET", "DELETE"])
def story_detail(request, pk):
    if request.method == "DELETE":
        return story_delete(request, pk)
    try: story = Story.objects.get(pk=pk)
    except Story.DoesNotExist: return error("Story not found.", 404)
    data = story_json(story, request.user)
    data["comments"] = [
        {
            "id": c.id,
            "author": user_json(c.author),
            "text": c.text,
            "createdAt": c.created_at.isoformat(),
            "isOwner": bool(request.user.is_authenticated and c.author_id == request.user.id),
        }
        for c in Comment.objects.filter(story=story).select_related("author").order_by("created_at")
    ]
    return JsonResponse({"story": data})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def questions(request):
    if request.method == "GET":
        category = request.GET.get("category", "").strip()
        items = Question.objects.all()
        if category and category.lower() != "all":
            items = items.filter(category__iexact=category)
        return JsonResponse({"items": [question_json(q, request.user) for q in items.order_by("-created_at")]})
    user = require_user(request)
    if not user: return error("Login required.", 401)
    data = body(request)
    title = str(data.get("title", "")).strip()
    question_body = str(data.get("body", "")).strip()
    category = str(data.get("category", "Budget & Costs")).strip()
    if not title: return error("Question title is required.")
    if not question_body: return error("Please add some details to your question.")
    question = Question.objects.create(author=user, title=title, body=question_body, category=category)
    return JsonResponse({"question": question_json(question, user)}, status=201)


@require_http_methods(["GET"])
@csrf_exempt
@require_http_methods(["GET", "DELETE"])
def question_detail(request, pk):
    if request.method == "DELETE":
        user = require_user(request)
        if not user:
            return error("Login required.", 401)
        try:
            question = Question.objects.get(pk=pk)
        except Question.DoesNotExist:
            return error("Question not found.", 404)
        if question.author_id != user.id and not user.is_staff:
            return error("You can only delete your own question.", 403)
        question.delete()
        return JsonResponse({"ok": True})
    try: question = Question.objects.get(pk=pk)
    except Question.DoesNotExist: return error("Question not found.", 404)
    answers = Answer.objects.filter(question=question).select_related("author").order_by("created_at")
    data = question_json(question, request.user)
    data["answersList"] = [{"id": a.id, "author": user_json(a.author), "text": a.text, "createdAt": a.created_at.isoformat(), "isOwner": bool(request.user.is_authenticated and a.author_id == request.user.id)} for a in answers]
    question.views += 1
    question.save(update_fields=["views"])
    return JsonResponse({"question": data})


@csrf_exempt
@require_http_methods(["POST"])
def answer_question(request, pk):
    user = require_user(request)
    if not user: return error("Login required.", 401)
    text = str(body(request).get("text", "")).strip()
    if not text: return error("Answer cannot be empty.")
    try: question = Question.objects.get(pk=pk)
    except Question.DoesNotExist: return error("Question not found.", 404)
    answer = Answer.objects.create(question=question, author=user, text=text)
    return JsonResponse({"answer": {"id": answer.id, "author": user_json(user), "text": answer.text, "createdAt": answer.created_at.isoformat(), "isOwner": True}}, status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
def answer_detail(request, pk):
    user = require_user(request)
    if not user:
        return error("Login required.", 401)
    try:
        answer = Answer.objects.get(pk=pk)
    except Answer.DoesNotExist:
        return error("Answer not found.", 404)
    if answer.author_id != user.id and not user.is_staff:
        return error("You can only delete your own answer.", 403)
    answer.delete()
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def trips(request):
    user = require_user(request)
    if not user:
        return error("Login required.", 401)

    if request.method == "GET":
        items = Trip.objects.filter(owner=user).order_by("-id")
        return JsonResponse({"items": [trip_json(t) for t in items]})

    if request.method == "POST":
        data = body(request)
        name = str(data.get("name", "")).strip()
        if not name:
            return error("Trip name is required.")
        trip = Trip.objects.create(
            owner=user,
            name=name,
            location=str(data.get("location", "")).strip(),
            start_date=parse_date_value(data.get("startDate")),
            duration=str(data.get("duration", "")).strip(),
            emoji=str(data.get("emoji", "🗺️")).strip() or "🗺️",
            color=str(data.get("color", "#B5D4F4")).strip() or "#B5D4F4",
            status=str(data.get("status", "Planning")).strip() or "Planning",
            notes=str(data.get("notes", "")).strip(),
        )
        return JsonResponse({"trip": trip_json(trip)}, status=201)



@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def trip_detail(request, pk):
    user = require_user(request)
    if not user:
        return error("Login required.", 401)
    try:
        trip = Trip.objects.get(pk=pk, owner=user)
    except Trip.DoesNotExist:
        return error("Trip not found.", 404)

    if request.method == "DELETE":
        trip.delete()
        return JsonResponse({"ok": True})

    data = body(request)
    for field in ("name", "location", "duration", "emoji", "color", "status", "notes"):
        if field in data:
            setattr(trip, field, str(data[field]).strip())
    if "startDate" in data:
        trip.start_date = parse_date_value(data.get("startDate"))
    trip.save()
    return JsonResponse({"trip": trip_json(trip)})


def parse_date_value(value):
    if not value:
        return None
    from datetime import date
    try:
        return date.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None


def trip_json(trip):
    return {
        "id": trip.id,
        "name": trip.name,
        "location": trip.location,
        "startDate": trip.start_date.isoformat() if trip.start_date else None,
        "duration": trip.duration,
        "emoji": trip.emoji,
        "color": trip.color,
        "status": trip.status,
        "notes": trip.notes,
        "isOwner": True,
    }


@require_http_methods(["GET"])
def destination_detail(request, pk):
    try:
        destination = Destination.objects.get(pk=pk)
    except Destination.DoesNotExist:
        return error("Destination not found.", 404)
    related = Destination.objects.exclude(pk=destination.pk).filter(
        Q(state__iexact=destination.state) | Q(tag__iexact=destination.tag)
    )[:4]
    return JsonResponse({
        "destination": destination_json(destination),
        "related": [destination_json(item) for item in related],
    })


@require_http_methods(["GET"])
def admin_overview(request):
    user = require_user(request)
    if not user or not user.is_staff:
        return error("Staff access required.", 403)
    return JsonResponse({
        "stats": {
            "users": User.objects.count(),
            "stories": Story.objects.count(),
            "questions": Question.objects.count(),
            "destinations": Destination.objects.count(),
        },
        "recentStories": [story_json(s, user, request) for s in Story.objects.all()[:8]],
        "recentQuestions": [question_json(q, user) for q in Question.objects.all().order_by("-created_at")[:8]],
    })


@csrf_exempt
@require_http_methods(["POST"])
def admin_destination_create(request):
    user = require_user(request)
    if not user or not user.is_staff:
        return error("Staff access required.", 403)
    data = body(request)
    name = str(data.get("name", "")).strip()
    if not name:
        return error("Destination name is required.")
    destination = Destination.objects.create(
        name=name,
        state=str(data.get("state", "")).strip(),
        tag=str(data.get("tag", "")).strip(),
        emoji=str(data.get("emoji", "📍")).strip() or "📍",
        color=str(data.get("color", "#9FE1CB")).strip() or "#9FE1CB",
        duration=str(data.get("duration", "")).strip(),
        budget=str(data.get("budget", "")).strip(),
        description=str(data.get("description", "")).strip(),
    )
    return JsonResponse({"destination": destination_json(destination)}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def follow(request, pk):
    user = require_user(request)
    if not user: return error("Login required.", 401)
    if user.id == pk: return error("You cannot follow yourself.")
    try: target = User.objects.get(pk=pk)
    except User.DoesNotExist: return error("User not found.", 404)
    relation = Follow.objects.filter(follower=user, following=target).first()
    if relation:
        relation.delete(); following = False
    else:
        Follow.objects.create(follower=user, following=target); following = True
    return JsonResponse({"following": following, "followers": Follow.objects.filter(following=target).count()})


@require_http_methods(["GET"])
def search(request):
    query = request.GET.get("q", "").strip()
    if not query:
        return JsonResponse({"stories": [], "users": [], "destinations": []})
    story_items = Story.objects.filter(Q(title__icontains=query) | Q(body__icontains=query) | Q(location__icontains=query))[:20]
    users = User.objects.filter(Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query))[:20]
    destination_items = Destination.objects.filter(Q(name__icontains=query) | Q(state__icontains=query) | Q(tag__icontains=query) | Q(description__icontains=query))[:20]
    return JsonResponse({
        "stories": [story_json(s, request.user,request) for s in story_items],
        "users": [user_json(u) for u in users],
        "destinations": [destination_json(d) for d in destination_items],
    })


@require_http_methods(["GET"])
def saved_stories(request):
    user = require_user(request)
    if not user: return error("Login required.", 401)
    items = StorySave.objects.filter(user=user).select_related("story").order_by("-created_at")
    return JsonResponse({"items": [story_json(item.story, user,request) for item in items]})
