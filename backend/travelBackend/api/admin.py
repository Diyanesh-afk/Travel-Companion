from django.contrib import admin
from .models import Profile, Destination, Story, StoryMedia, StoryLike, StorySave, Comment, Question, Answer, Trip, Follow

for model in [Profile, Destination, Story, StoryMedia, StoryLike, StorySave, Comment, Question, Answer, Trip, Follow]:
    admin.site.register(model)
