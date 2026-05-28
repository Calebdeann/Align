import { ImageSourcePropType } from 'react-native';

export const WORKOUT_PREVIEW_LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

export type PlanReview = {
  name: string;
  rating: number;
  text: string;
};

export type Plan = {
  id: string;
  name: string;
  emoji: string;
  joined: number;
  highlights: [string, string, string];
  overview: string;
  reviews: PlanReview[];
  image: ImageSourcePropType;
};

export const PLANS: Plan[] = [
  {
    id: 'pilates-princess',
    name: 'Pilates Princess Plan',
    emoji: '🌸',
    joined: 9247,
    highlights: ['2 Pilates Sessions (Access Required)', '3 Gym Sessions', '8 Week Program'],
    overview:
      'Reformer and mat pilates focus on the glutes, arms, and core, working with lower weights and higher reps. To build and define muscle, you also need to be lifting heavy weights in the gym to complement the work you are doing on the reformer.',
    reviews: [
      {
        name: 'Sofia R.',
        rating: 5,
        text: 'literally obsessed. I do these before work and feel taller by the end of the day lol. my abs are insane now',
      },
      {
        name: 'Maddie',
        rating: 5,
        text: 'I used to do reformer classes that cost me $40 a pop. this is basically the same flow and I cancelled my studio membership. wish I found this sooner',
      },
      {
        name: 'Hannah K.',
        rating: 4,
        text: "Week 6 update. My posture has changed so much my mum noticed before I told her I was doing anything. Only 4 stars because some weeks repeat the same flow but maybe I'm just impatient.",
      },
      {
        name: 'Tilly',
        rating: 5,
        text: "ok the inner thigh stuff is brutal in the best way. I can feel things I didn't know existed",
      },
      {
        name: 'Brookelyn M.',
        rating: 5,
        text: "Im 34 and have two kids. this is the only thing that hasn't wrecked my back or my pelvic floor. thankyou thankyou thankyou",
      },
    ],
    image: require('../../assets/Onboarding Assets/Onboarding P11/Pilates_notext.png'),
  },
  {
    id: 'hourglass',
    name: 'Hourglass Plan',
    emoji: '⏳',
    joined: 6483,
    highlights: ['4 Workouts Per Week', '1-1.5 Hour Sessions', '12 Week Program'],
    overview:
      'The Hourglass plan trains the muscles that shape a strong silhouette. Glute medius work widens the hips, shoulder and back training make the waist appear smaller, and targeted ab work tones the core. Paired with cardio and eating in a slight caloric deficit, this 12 week program is designed to build a confident hourglass shape.',
    reviews: [
      {
        name: 'Jess',
        rating: 5,
        text: 'the shoulder work is what changed everything for me. I never realised how much delt growth makes your waist look smaller in comparison. mind blown',
      },
      {
        name: 'Amelia P.',
        rating: 5,
        text: "Eight weeks in and I had to buy new jeans because the waist gapped on all my old ones. Didn't lose any weight on the scale either",
      },
      {
        name: 'Reese',
        rating: 4,
        text: 'Love the program but I wish the warmups were a bit longer because I feel like I need more activation before lifting. Otherwise insane results, my boyfriend keeps commenting lol',
      },
      {
        name: 'Kayla J.',
        rating: 5,
        text: 'finally a program that explains WHY no oblique work. every other plan has me doing side bends and making my waist thicker',
      },
      {
        name: 'priya s',
        rating: 5,
        text: 'I did this for my wedding prep starting 14 weeks out. literally cried looking at the photos. worth every cent',
      },
    ],
    image: require('../../assets/Onboarding Assets/Onboarding P11/HourGlass_notext.png'),
  },
  {
    id: 'booty',
    name: 'Booty Plan',
    emoji: '🍑',
    joined: 5219,
    highlights: ['4-5 Workouts Per Week', '60 Minute Sessions', '12 Week Program'],
    overview:
      'This plan prioritises glute focused workouts 3x per week, with an additional 1-2 upper body workouts depending on whether you are training 4 or 5 days per week. This plan is best achieved whilst making sure to eat enough food and protein.',
    reviews: [
      {
        name: 'Tay',
        rating: 5,
        text: 'added 2 inches to my hips in 10 weeks and I have not changed my diet meaningfully. I am a hip thrust evangelist now',
      },
      {
        name: 'Georgia L.',
        rating: 5,
        text: "I've done bret contreras style programs before and this is honestly comparable. the progression scheme actually works if you log your lifts",
      },
      {
        name: 'Mikayla',
        rating: 4,
        text: "great program but you NEED a gym for this one. tried to do it at home with bands and it's not the same. 4 stars only because I wish there was a clearer home version",
      },
      {
        name: 'bec_h',
        rating: 5,
        text: "my partner thinks I've been getting injections. it's just consistent hip thrusts babes",
      },
      {
        name: 'Charlotte D.',
        rating: 5,
        text: 'Currently in week 9. My deadlift has gone from 50kg to 80kg and the visual difference is unreal. The program teaches you how to actually train, not just follow random workouts.',
      },
    ],
    image: require('../../assets/Onboarding Assets/Onboarding P11/Booty_notext.png'),
  },
  {
    id: 'summer-body',
    name: 'Summer Body Plan',
    emoji: '🌊',
    joined: 4361,
    highlights: ['5-6 Workouts Per Week', '60 Minute Sessions', '12 Week Program'],
    overview:
      'This 12 week plan is designed to get you ready for summer! This program combines focused strength work with cardio finishers to build shape, drop body fat, and walk into summer feeling sexy.',
    reviews: [
      {
        name: 'Indi',
        rating: 5,
        text: 'started this 10 weeks out from bali. did not regret a single workout. came back tan AND toned for once',
      },
      {
        name: 'Olivia M.',
        rating: 5,
        text: "the finishers genuinely kick my ass but they're only 5 minutes so I can't talk myself out of them. clever programming",
      },
      {
        name: 'sienna',
        rating: 4,
        text: 'good plan but I wish there were more options for the conditioning, I get bored seeing the same finisher twice in a week. still got great results tho',
      },
      {
        name: 'Lara T.',
        rating: 5,
        text: "I'm 41 and this is the leanest I've been since my 20s. The combo of weights plus the metabolic stuff works better than the hours of cardio I used to do.",
      },
      {
        name: 'zoeeeyyy',
        rating: 5,
        text: 'did this for schoolies and I felt insane in every bikini. enough said',
      },
    ],
    image: require('../../assets/Onboarding Assets/Onboarding P11/Summer_notext.png'),
  },
  {
    id: 'it-girl',
    name: 'IT Girl Plan',
    emoji: '✨',
    joined: 3572,
    highlights: ['4 Workouts Per Week', 'Cardio Of Choice 4x Week', '12 Week Program'],
    overview:
      'an IT Girl is a lifestyle, a state of mind, a way of life. An IT Girl is disciplined, humble and keeps promises to herself. This workout plan is to help you develop consistent healthy habits that continue long after the program ends.',
    reviews: [
      {
        name: 'Phoebe',
        rating: 5,
        text: "this is the only plan I've ever actually stuck to for 6 months. I think because it doesn't feel like a punishment, it feels like a lifestyle",
      },
      {
        name: 'Annabelle W.',
        rating: 5,
        text: 'love love love. The run day is so easy to slot in on a sunday morning and it makes my whole week feel more put together',
      },
      {
        name: 'kiki',
        rating: 4,
        text: 'really good but as someone who already runs I wish there was an option to swap the easy run for an interval session. otherwise no notes',
      },
      {
        name: 'Maya R.',
        rating: 5,
        text: 'I work 60 hour weeks in finance and this is the only thing I can keep up with. 4 workouts is the sweet spot. anything more and I burn out',
      },
      {
        name: 'jordann.b',
        rating: 5,
        text: 'literally feel like the main character every time I finish a session lol. the variety keeps it interesting',
      },
    ],
    image: require('../../assets/Onboarding Assets/Onboarding P11/ITGirl_notext.png'),
  },
  {
    id: 'busy-girl',
    name: 'Busy Girl Plan',
    emoji: '🫦',
    joined: 2738,
    highlights: ['3 Workouts Per Week', '45-60 Minute Sessions', '8 Week Program'],
    overview:
      'Whether you are working multiple jobs, studying, a mum, or just do not want to spend hours in the gym every week, this plan is for you. If you are someone who does not get many steps, this program pairs perfectly with daily walks. Listen to podcasts, bring the kids, take some me time and unwind.',
    reviews: [
      {
        name: 'Ruby',
        rating: 5,
        text: "I've never lifted a weight in my life before this. the form videos are SO good, I never felt lost or stupid",
      },
      {
        name: 'Hayley G.',
        rating: 5,
        text: 'I bought this after my divorce when I needed something just for me. 12 weeks later I feel completely different. not just my body, my whole mindset',
      },
      {
        name: 'emm',
        rating: 4,
        text: 'good starter program but I outgrew it by week 8 ish. would have liked a clearer recommendation for what to do next',
      },
      {
        name: 'Steph B.',
        rating: 5,
        text: 'as someone who was so intimidated by the gym I literally cried in the carpark once, this gave me the confidence to actually train. cannot recommend enough',
      },
      {
        name: 'NatalieK_',
        rating: 5,
        text: 'started at 38 having never exercised consistently. down 6kg, sleeping better, my anxiety is so much lower. genuinely life changing',
      },
    ],
    image: require('../../assets/Onboarding Assets/Onboarding P11/Busygirl_notext.png'),
  },
  {
    id: 'muscle-mommy',
    name: 'Muscle Mommy Plan',
    emoji: '💪',
    joined: 1894,
    highlights: ['5 Workouts Per Week', '1-1.5 Hour Sessions', '12 Week Program'],
    overview:
      'Built for muscle and strength. This program is designed to build hypertrophy across all major muscle groups, centred on heavy compound lifts and training as many muscle groups as possible each week. We recommend eating at maintenance calories or in a slight surplus, plus increasing your protein intake to support muscle growth.',
    reviews: [
      {
        name: 'Liv',
        rating: 5,
        text: "FINALLY a women's program that actually programs heavy lifting properly. no pink dumbbells, no 'toning', just real strength work. thankyou",
      },
      {
        name: 'Sam W.',
        rating: 5,
        text: 'added 15kg to my squat in 12 weeks. came from a powerlifting background and was worried this would be too soft. it absolutely is not.',
      },
      {
        name: 'coreyyx',
        rating: 4,
        text: 'love the program but the 60 min sessions are tough to fit in some weeks. wish there was a shorter alternative day for when life is busy. otherwise 10/10',
      },
      {
        name: 'Renee H.',
        rating: 5,
        text: "I'm 28 and the strongest I've ever been. squatting 100kg for reps feels insane. this program teaches you that being strong is the goal, not being small",
      },
      {
        name: 'bxlex',
        rating: 5,
        text: 'the deadlift progression is chefs kiss. went from being scared of the bar to pulling 120kg. obsessed',
      },
    ],
    image: require('../../assets/Onboarding Assets/Onboarding P11/Muscle_notext.png'),
  },
  {
    id: 'home',
    name: 'Home Plan',
    emoji: '🏡',
    joined: 1486,
    highlights: ['5 Workouts Per Week', '30-60 Minute Sessions', '8 Week Program'],
    overview:
      'This program combines bodyweight exercises (pilates style) with dumbbell and barbell only exercises that you can do at home with minimal equipment.',
    reviews: [
      {
        name: 'Issy',
        rating: 5,
        text: 'I travel for work constantly and this has been a game changer. all I need is a band and a hotel room. no more excuses',
      },
      {
        name: 'Rachel P.',
        rating: 5,
        text: 'Cancelled my gym membership three months ago and have not regretted it once. The band progressions are actually challenging if you do them properly.',
      },
      {
        name: 'megzz',
        rating: 4,
        text: 'really solid program. only thing is some of the single leg stuff is hard to balance without something to hold onto. otherwise super doable from my living room',
      },
      {
        name: 'Caitlin M.',
        rating: 5,
        text: "I'm a SAHM with two under three. I do this while they nap. it has saved my mental health more than my physical health honestly",
      },
      {
        name: 'thalia.x',
        rating: 5,
        text: "skeptical at first because how good can a no equipment plan really be?? answer: very good. I'm visibly stronger and I do not own a single dumbbell",
      },
    ],
    image: require('../../assets/Onboarding Assets/Onboarding P11/Home_notext.png'),
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
