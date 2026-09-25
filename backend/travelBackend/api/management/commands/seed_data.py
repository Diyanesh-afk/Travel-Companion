from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Profile, Destination, Story, Question, Answer, Trip

class Command(BaseCommand):
    help='Seed Travel Companion with demo content.'
    def handle(self,*args,**kwargs):
        user,created=User.objects.get_or_create(username='demo',defaults={'first_name':'Arjun','last_name':'Kumar','email':'demo@example.com'})
        if created:user.set_password('demo12345');user.is_staff=True;user.save()
        elif not user.is_staff:
            user.is_staff=True; user.save(update_fields=['is_staff'])
        p, _=Profile.objects.get_or_create(user=user);p.location='Coimbatore, TN';p.bio='Traveller | Storyteller | Part-time chai philosopher ☕';p.states_explored=14;p.countries_explored=3;p.avatar_initials='AK';p.save()
        destinations=[
            ('Goa','','Beach','🏖','#9FE1CB','3 days','₹7,000','Beaches, cafés and relaxed coastal stays.'),('Ooty','Tamil Nadu','Hills','⛰','#C0DD97','2 days','₹4,000','Cool weather, tea estates and mountain views.'),('Munnar','Kerala','Tea trails','🌿','#9FE1CB','3 days','₹6,000','Tea plantations, misty hills and waterfalls.'),('Jaipur','Rajasthan','Heritage','🏯','#FAC775','3 days','₹5,500','Forts, markets and historic architecture.'),('Leh','Ladakh','Adventure','❄️','#B5D4F4','7 days','₹15,000','High-altitude landscapes and mountain passes.'),('Hampi','Karnataka','Heritage','🗿','#F5C4B3','3 days','₹4,000','Ancient ruins and boulder landscapes.'),('Tawang','Arunachal Pradesh','Offbeat','🏔','#B5D4F4','6 days','₹12,000','Monasteries, lakes and Himalayan roads.'),('Valley of Flowers','Uttarakhand','Trek','🌸','#C0DD97','5 days','₹8,500','Alpine meadows and high-altitude trekking.')]
        for x in destinations: Destination.objects.get_or_create(name=x[0],defaults={'state':x[1],'tag':x[2],'emoji':x[3],'color':x[4],'duration':x[5],'budget':x[6],'description':x[7]})
        stories=[
            ('Rahul Sharma','rahul','Coorg, Karnataka','48 Hours in Coorg: The Coffee Country Diaries','Woke up to mist rolling over the estate, a cup of freshly brewed coffee in hand.','Here is everything I would do differently on a second visit.','Story',['Road Trips','Food'],'#C0DD97'),
            ('Priya Menon','priya','Pondicherry','Budget stays in Pondicherry under ₹1500/night','French Quarter vibes do not have to cost a fortune.','Here are guesthouses and practical budget tips from a weekend trip.','Tip',['Budget','Weekend'],'#9FE1CB'),
            ('Kiran V','kiran','Spiti Valley, HP','Road trip to Kaza in September: what nobody tells you','The roads were better than expected, the altitude was not.','A full itinerary plus tips for first-timers making the Manali–Kaza loop.','Story',['Road Trips','Adventure'],'#B5D4F4'),
            ('Sneha Nair','sneha','Bali, Indonesia','Solo in Bali for 10 Days on ₹45,000 — Full Breakdown','Flights, stays, food and scooter rental in one transparent budget guide.','A detailed international budget itinerary for first-time solo travellers.','Photos',['Budget','Solo','International'],'#9FE1CB'),
            ('Vikram Kumar','vikram','Uttarakhand','Roopkund Trek: The Lake of Skeletons','At high altitude lies a glacial lake surrounded by a mysterious history.','Our eight-day trek with preparation and route notes.','Story',['Treks','Adventure'],'#AFA9EC')]
        for name,uname,loc,title,ex,body,typ,tags,color in stories:
            u,cr=User.objects.get_or_create(username=uname,defaults={'first_name':name.split()[0],'last_name':' '.join(name.split()[1:])})
            if cr:u.set_password('demo12345');u.save()
            Profile.objects.get_or_create(user=u,defaults={'avatar_initials':name[0]+name.split()[-1][0],'location':loc})
            Story.objects.get_or_create(title=title,defaults={'author':u,'location':loc,'excerpt':ex,'body':body,'story_type':typ,'tags':tags,'thumbnail':color,'category':typ})
        qs=[('Best time to visit Andaman with two kids under 10?','Planning a family trip to Andaman in November. Which islands are best for families?','Accommodation',True,'October to May is commonly preferred for weather; check local conditions before booking.'),('Solo female travel — is Rajasthan actually safe?','Planning Jaisalmer → Jodhpur → Jaipur in March. What practical precautions should I take?','Safety',False,'Book reputable accommodation, plan transport and avoid isolated areas late at night.'),('Kedarkantha trek in December — cold or manageable?','First high-altitude trek. What gear is non-negotiable?','Packing',True,'Thermal layers, insulated outerwear, gloves and appropriate footwear are key.')]
        for title,bod,cat,solved,answer in qs:
            q,cr=Question.objects.get_or_create(title=title,defaults={'author':user,'body':bod,'category':cat,'solved':solved})
            if cr: Answer.objects.create(question=q,author=user,text=answer,is_top=True)
        if not user.trips.exists():
            Trip.objects.create(owner=user,name='Coorg, Karnataka',location='Coorg, Karnataka',duration='3 days',emoji='☕',color='#C0DD97',status='Completed')
            Trip.objects.create(owner=user,name='Bali, Indonesia',location='Bali, Indonesia',duration='10 days',emoji='🌺',color='#FAC775',status='Upcoming')
        self.stdout.write(self.style.SUCCESS('Seed data ready. Demo login: demo / demo12345'))
