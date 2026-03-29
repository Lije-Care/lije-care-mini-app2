import type { DetailedAssessment } from '@/design-system/types';

export type DevelopmentalSubCategory = 'Social' | 'Language' | 'Cognitive' | 'Physical';

interface MilestoneCategoryGroup {
  key: DevelopmentalSubCategory;
  label: string;
  questions: string[];
}

interface MilestoneDefinition {
  ageMonths: number;
  groups: MilestoneCategoryGroup[];
}

export interface MilestoneQuestion {
  id: string;
  ageMonths: number;
  subCategory: DevelopmentalSubCategory;
  subCategoryLabel: string;
  question: string;
}

export interface DevelopmentTracePrompt {
  id: string;
  question: string;
  ageMonths: number;
}

export const DEVELOPMENTAL_SUBCATEGORY_ORDER: DevelopmentalSubCategory[] = [
  'Social',
  'Language',
  'Cognitive',
  'Physical',
];

export const DEVELOPMENTAL_SUBCATEGORY_LABELS: Record<DevelopmentalSubCategory, string> = {
  Social: 'Social/Emotional Milestones',
  Language: 'Language/Communication Milestones',
  Cognitive: 'Cognitive Milestones',
  Physical: 'Movement/Physical Development Milestones',
};

const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    ageMonths: 2,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Calms down when spoken to or picked up',
          'Looks at your face',
          'Seems happy to see you when you walk up to her',
          'Smiles when you talk to or smile at her',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: ['Makes sounds other than crying', 'Reacts to loud sounds'],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: ['Watches you as you move', 'Looks at a toy for several seconds'],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Holds head up when on tummy',
          'Moves both arms and both legs',
          'Opens hands briefly',
        ],
      },
    ],
  },
  {
    ageMonths: 4,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Smiles on his own to get your attention',
          'Chuckles (not yet a full laugh) when you try to make her laugh',
          'Looks at you, moves, or makes sounds to get or keep your attention',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Makes sounds like "oooo", "aahh" (cooing)',
          'Makes sounds back when you talk to him',
          'Turns head towards the sound of your voice',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'If hungry, opens mouth when she sees breast or bottle',
          'Looks at his hands with interest',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Holds head steady without support when you are holding her',
          'Holds a toy when you put it in his hand',
          'Uses her arm to swing at toys',
          'Brings hands to mouth',
          'Pushes up onto elbows/forearms when on tummy',
        ],
      },
    ],
  },
  {
    ageMonths: 6,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Knows familiar people',
          'Likes to look at himself in a mirror',
          'Laughs',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Takes turns making sounds with you',
          'Blows raspberries (sticks tongue out and blows)',
          'Makes squealing noises',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Puts things in her mouth to explore them',
          'Reaches to grab a toy he wants',
          "Closes lips to show she doesn't want more food",
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Rolls from tummy to back',
          'Pushes up with straight arms when on tummy',
          'Leans on hands to support himself when sitting',
        ],
      },
    ],
  },
  {
    ageMonths: 9,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Is shy, clingy, or fearful around strangers',
          'Shows several facial expressions, like happy, sad, angry, and surprised',
          'Looks when you call her name',
          'Reacts when you leave (looks, reaches for you, or cries)',
          'Smiles or laughs when you play peek-a-boo',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Makes different sounds like mamamama and babababa',
          'Lifts arms up to be picked up',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Looks for objects when dropped out of sight (like his spoon or toy)',
          'Bangs two things together',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Gets to a sitting position by herself',
          'Moves things from one hand to her other hand',
          'Uses fingers to rake food towards himself',
          'Sits without support',
        ],
      },
    ],
  },
  {
    ageMonths: 12,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: ['Plays games with you, like pat-a-cake'],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Waves bye-bye',
          'Calls a parent mama or dada or another special name',
          'Understands no (pauses briefly or stops when you say it)',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Puts something in a container, like a block in a cup',
          'Looks for things he sees you hide, like a toy under a blanket',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Pulls up to stand',
          'Walks, holding on to furniture',
          'Drinks from a cup without a lid, as you hold it',
          'Picks things up between thumb and pointer finger, like small bits of food',
        ],
      },
    ],
  },
  {
    ageMonths: 15,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Copies other children while playing, like taking toys out of a container when another child does',
          'Shows you an object she likes',
          'Claps when excited',
          'Hugs stuffed doll or other toy',
          'Shows you affection (hugs, cuddles, or kisses you)',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Tries to say one or two words besides mama or dada, like ba for ball or da for dog',
          'Looks at a familiar object when you name it',
          'Follows directions given with both a gesture and words (for example, gives you a toy when you hold out your hand and say, Give me the toy)',
          'Points to ask for something or to get help',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Tries to use things the right way, like a phone, cup, or book',
          'Stacks at least two small objects, like blocks',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: ['Takes a few steps on his own', 'Uses fingers to feed herself some food'],
      },
    ],
  },
  {
    ageMonths: 18,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Moves away from you, but looks to make sure you are close by',
          'Points to show you something interesting',
          'Puts hands out for you to wash them',
          'Looks at a few pages in a book with you',
          'Helps you dress him by pushing arm through sleeve or lifting up foot',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Tries to say three or more words besides mama or dada',
          'Follows one-step directions without any gestures, like giving you the toy when you say, Give it to me',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Copies you doing chores, like sweeping with a broom',
          'Plays with toys in a simple way, like pushing a toy car',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Walks without holding on to anyone or anything',
          'Scribbles',
          'Drinks from a cup without a lid and may spill sometimes',
          'Feeds herself with her fingers',
          'Tries to use a spoon',
          'Climbs on and off a couch or chair without help',
        ],
      },
    ],
  },
  {
    ageMonths: 24,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Notices when others are hurt or upset, like pausing or looking sad when someone is crying',
          'Looks at your face to see how to react in a new situation',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Points to things in a book when you ask, like Where is the bear?',
          'Says at least two words together, like More milk',
          'Points to at least two body parts when you ask him to show you',
          'Uses more gestures than just waving and pointing, like blowing a kiss or nodding yes',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Holds something in one hand while using the other hand (for example, holding a container and taking the lid off)',
          'Tries to use switches, knobs, or buttons on a toy',
          'Plays with more than one toy at the same time, like putting toy food on a toy plate',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Kicks a ball',
          'Runs',
          'Walks (not climbs) up a few stairs with or without help',
          'Eats with a spoon',
        ],
      },
    ],
  },
  {
    ageMonths: 30,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Plays next to other children and sometimes plays with them',
          'Shows you what she can do by saying, Look at me!',
          'Follows simple routines when told, like helping to pick up toys when you say, It is clean-up time',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Says about 50 words',
          'Says two or more words together, with one action word, like Doggie run',
          'Names things in a book when you point and ask, What is this?',
          'Says words like I, me, or we',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Uses things to pretend, like feeding a block to a doll as if it were food',
          'Shows simple problem-solving skills, like standing on a small stool to reach something',
          'Follows two-step instructions like Put the toy down and close the door',
          'Shows he knows at least one color, like pointing to a red crayon when you ask, Which one is red?',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Uses hands to twist things, like turning doorknobs or unscrewing lids',
          'Takes some clothes off by himself, like loose pants or an open jacket',
          'Jumps off the ground with both feet',
          'Turns book pages, one at a time, when you read to her',
        ],
      },
    ],
  },
  {
    ageMonths: 36,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Calms down within 10 minutes after you leave her, like at a childcare drop off',
          'Notices other children and joins them to play',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Talks with you in conversation using at least two back-and-forth exchanges',
          'Asks who, what, where, or why questions, like Where is mommy/daddy?',
          'Says what action is happening in a picture or book when asked, like running, eating, or playing',
          'Says first name, when asked',
          'Talks well enough for others to understand, most of the time',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Draws a circle, when you show him how',
          'Avoids touching hot objects, like a stove, when you warn her',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Strings items together, like large beads or macaroni',
          'Puts on some clothes by himself, like loose pants or a jacket',
          'Uses a fork',
        ],
      },
    ],
  },
  {
    ageMonths: 48,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Pretends to be something else during play (teacher, superhero, dog)',
          'Asks to go play with children if none are around, like Can I play with Alex?',
          'Comforts others who are hurt or sad, like hugging a crying friend',
          'Avoids danger, like not jumping from tall heights at the playground',
          'Likes to be a helper',
          'Changes behavior based on where she is (place of worship, library, playground)',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Says sentences with four or more words',
          'Says some words from a song, story, or nursery rhyme',
          'Talks about at least one thing that happened during his day, like I played soccer',
          'Answers simple questions like What is a coat for? or What is a crayon for?',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Names a few colors of items',
          'Tells what comes next in a well-known story',
          'Draws a person with three or more body parts',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: [
          'Catches a large ball most of the time',
          'Serves himself food or pours water, with adult supervision',
          'Unbuttons some buttons',
          'Holds crayon or pencil between fingers and thumb (not a fist)',
        ],
      },
    ],
  },
  {
    ageMonths: 60,
    groups: [
      {
        key: 'Social',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Social,
        questions: [
          'Follows rules or takes turns when playing games with other children',
          'Sings, dances, or acts for you',
          'Does simple chores at home, like matching socks or clearing the table after eating',
        ],
      },
      {
        key: 'Language',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Language,
        questions: [
          'Tells a story she heard or made up with at least two events (for example, a cat was stuck in a tree and a firefighter saved it)',
          'Answers simple questions about a book or story after you read or tell it to him',
          'Keeps a conversation going with more than three back-and-forth exchanges',
          'Uses or recognizes simple rhymes (bat-cat, ball-tall)',
        ],
      },
      {
        key: 'Cognitive',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Cognitive,
        questions: [
          'Counts to 10',
          'Names some numbers between 1 and 5 when you point to them',
          'Uses words about time, like yesterday, tomorrow, morning, or night',
          'Pays attention for 5 to 10 minutes during activities (for example, story time or making arts and crafts; screen time does not count)',
          'Writes some letters in her name',
          'Names some letters when you point to them',
        ],
      },
      {
        key: 'Physical',
        label: DEVELOPMENTAL_SUBCATEGORY_LABELS.Physical,
        questions: ['Buttons some buttons', 'Hops on one foot'],
      },
    ],
  },
];

const MIN_MILESTONE_AGE = MILESTONE_DEFINITIONS[0].ageMonths;

const normalizeAgeInMonths = (ageInMonths: number): number => {
  if (!Number.isFinite(ageInMonths)) {
    return MIN_MILESTONE_AGE;
  }

  return Math.max(Math.floor(ageInMonths), MIN_MILESTONE_AGE);
};

const getQuestionId = (
  ageMonths: number,
  subCategory: DevelopmentalSubCategory,
  index: number
): string => {
  const prefixMap: Record<DevelopmentalSubCategory, string> = {
    Social: 's',
    Language: 'l',
    Cognitive: 'c',
    Physical: 'p',
  };

  return `dev-${ageMonths}m-${prefixMap[subCategory]}-${index + 1}`;
};

export const getAgeInMonthsFromDob = (dob?: string): number => {
  if (!dob) return MIN_MILESTONE_AGE;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return MIN_MILESTONE_AGE;

  const today = new Date();
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months += today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months -= 1;
  }

  return normalizeAgeInMonths(months);
};

const getLatestMilestoneForAge = (ageInMonths: number): MilestoneDefinition => {
  const normalizedAge = normalizeAgeInMonths(ageInMonths);
  const eligibleMilestones = MILESTONE_DEFINITIONS.filter(
    (milestone) => milestone.ageMonths <= normalizedAge
  );

  return eligibleMilestones[eligibleMilestones.length - 1] ?? MILESTONE_DEFINITIONS[0];
};

export const getMilestoneQuestionsUpToAge = (ageInMonths: number): MilestoneQuestion[] => {
  const normalizedAge = normalizeAgeInMonths(ageInMonths);

  return MILESTONE_DEFINITIONS.filter((milestone) => milestone.ageMonths <= normalizedAge).flatMap(
    (milestone) =>
      milestone.groups.flatMap((group) =>
        group.questions.map((question, index) => ({
          id: getQuestionId(milestone.ageMonths, group.key, index),
          ageMonths: milestone.ageMonths,
          subCategory: group.key,
          subCategoryLabel: group.label,
          question,
        }))
      )
  );
};

export const getDevelopmentalAssessmentsForAge = (
  ageInMonths: number
): DetailedAssessment[] => {
  return getMilestoneQuestionsUpToAge(ageInMonths).map((question) => ({
    id: question.id,
    title: question.question,
    category: 'Developmental',
    subCategory: question.subCategory,
    type: 'subjective',
    answer: 'unanswered',
  }));
};

export const getDevelopmentTracePromptsForAge = (
  ageInMonths: number,
  limit = 2
): DevelopmentTracePrompt[] => {
  const milestone = getLatestMilestoneForAge(ageInMonths);

  return milestone.groups
    .flatMap((group) =>
      group.questions.map((question, index) => ({
        id: getQuestionId(milestone.ageMonths, group.key, index),
        question,
        ageMonths: milestone.ageMonths,
      }))
    )
    .slice(0, Math.max(limit, 0));
};
