from django.urls import path
from django.http import JsonResponse
from django.middleware.csrf import get_token
from . import views

def csrf_token(request):
    return JsonResponse({
        "csrfToken": get_token(request)
    })

urlpatterns = [
    path("csrf/", csrf_token),
    path("health/", views.health),
    path("auth/register/", views.register),
    path("auth/login/", views.login_api),
    path("auth/logout/", views.logout_api),
    path("me/", views.me),
    path("profile/", views.update_profile),
    path("me/profile/", views.update_profile),
    path("home/", views.home),
    path("destinations/", views.destinations),
    path("destinations/<int:pk>/", views.destination_detail),
    path("stories/", views.stories),
    path("stories/<int:pk>/", views.story_detail),
    path("comments/<int:pk>/", views.comment_detail),
    path("stories/<int:pk>/like/", views.story_like),
    path("stories/<int:pk>/save/", views.story_save),
    path("stories/<int:pk>/comments/", views.story_comment),
    path("saved-stories/", views.saved_stories),
    path("questions/", views.questions),
    path("questions/<int:pk>/", views.question_detail),
    path("questions/<int:pk>/answers/", views.answer_question),
    path("answers/<int:pk>/", views.answer_detail),
    path("trips/", views.trips),
    path("trips/<int:pk>/", views.trip_detail),
    path("users/<int:pk>/follow/", views.follow),
    path("search/", views.search),
    path("admin/overview/", views.admin_overview),
    path("admin/destinations/", views.admin_destination_create),

]

