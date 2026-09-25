from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    location = models.CharField(max_length=120, blank=True)
    bio = models.TextField(blank=True)
    avatar_initials = models.CharField(max_length=8, blank=True)
    states_explored = models.PositiveIntegerField(default=0)
    countries_explored = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.user.username


class Destination(models.Model):
    name = models.CharField(max_length=120)
    state = models.CharField(max_length=120, blank=True)
    tag = models.CharField(max_length=60, blank=True)
    emoji = models.CharField(max_length=8, default="📍")
    color = models.CharField(max_length=20, default="#9FE1CB")
    duration = models.CharField(max_length=40, blank=True)
    budget = models.CharField(max_length=40, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Story(models.Model):
    STORY_TYPES = [
        ("Story", "Story"),
        ("Photos", "Photos"),
        ("Video", "Video"),
        ("Tip", "Tip"),
    ]
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="stories")
    location = models.CharField(max_length=150, blank=True)
    title = models.CharField(max_length=220)
    excerpt = models.TextField(blank=True)
    body = models.TextField(blank=True)
    category = models.CharField(max_length=30, default="Story")
    story_type = models.CharField(max_length=20, choices=STORY_TYPES, default="Story")
    tags = models.JSONField(default=list, blank=True)
    read_time = models.CharField(max_length=30, default="5 min")
    thumbnail = models.CharField(max_length=20, default="#B5D4F4")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def like_count(self):
        return self.likes.count()

    @property
    def save_count(self):
        return self.saves.count()

    @property
    def comment_count(self):
        return self.comments.count()


class StoryMedia(models.Model):
    MEDIA_TYPES = [("image", "Image"), ("video", "Video")]
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="media")
    file = models.FileField(upload_to="stories/%Y/%m/")
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class StoryLike(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["story", "user"], name="unique_story_like")
        ]


class StorySave(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="saves")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["story", "user"], name="unique_story_save")
        ]


class Comment(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class Question(models.Model):
    CATEGORY_CHOICES = [
        ("Visa & Docs", "Visa & Docs"),
        ("Budget & Costs", "Budget & Costs"),
        ("Safety", "Safety"),
        ("Packing", "Packing"),
        ("Accommodation", "Accommodation"),
        ("Transport", "Transport"),
    ]
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="questions")
    title = models.CharField(max_length=240)
    body = models.TextField(blank=True)
    category = models.CharField(max_length=60, choices=CATEGORY_CHOICES, default="Budget & Costs")
    solved = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def reply_count(self):
        return self.answers.count()


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    is_top = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Trip(models.Model):
    STATUS = [
        ("Upcoming", "Upcoming"),
        ("Completed", "Completed"),
        ("Planning", "Planning"),
    ]
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="trips")
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=150, blank=True)
    start_date = models.DateField(null=True, blank=True)
    duration = models.CharField(max_length=40, blank=True)
    emoji = models.CharField(max_length=8, default="🗺️")
    color = models.CharField(max_length=20, default="#B5D4F4")
    status = models.CharField(max_length=20, choices=STATUS, default="Planning")
    notes = models.TextField(blank=True)


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["follower", "following"], name="unique_follow")
        ]
