import type { DetailedAssessment } from '@/design-system/types';
import i18n from '@/i18n/i18n';

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

const AMHARIC_QUESTION_OVERRIDES: Record<string, string> = {
  'dev-2m-s-1': 'ሲያናግሩት ወይም ሲያቅፉት ይረጋጋል',
  'dev-2m-s-2': 'ፊትዎን ትኩር ብሎ ይመለከታል',
  'dev-2m-s-3': 'ወደ እሱ ሲቀርቡ በማየትዎ ደስተኛ ይመስላል',
  'dev-2m-s-4': 'ሲያናግሩት ወይም ፈገግ ሲሉለት ፈገግ ይላል',
  'dev-2m-l-1': 'ከማልቀስ ውጪ ያሉ ሌሎች ድምፆችን ያወጣል',
  'dev-2m-l-2': 'ለከፍተኛ ድምፆች ምላሽ ይሰጣል (ይደነግጣል/ይዞራል)',
  'dev-2m-c-1': 'ሲንቀሳቀሱ በአይንዎ ይከተልዎታል',
  'dev-2m-c-2': 'አንድን አሻንጉሊት ለተወሰኑ ሰከንዶች ትኩር ብሎ ይመለከታል',
  'dev-2m-p-1': 'በሆዱ በሚተኛበት ጊዜ እራሱን ቀና ያደርጋል',
  'dev-2m-p-2': 'ሁለቱንም እጆቹንና እግሮቹን ያንቀሳቅሳል',
  'dev-2m-p-3': 'እጆቹን ለጥቂት ጊዜያት ከፍቶ ያቆያል',
  'dev-4m-s-1': 'የእርስዎን ትኩረት ለመሳብ በራሱ ፈገግ ይላል',
  'dev-4m-s-2': 'ሊያሳቁት ሲሞክሩ ድምፅ አውጥቶ ፈገግ ይላል (ገና ሙሉ ሳቅ ባይሆንም)',
  'dev-4m-s-3': 'ትኩረት ለማግኘት ወይም ትኩረትዎን ለማቆየት እርስዎን ይመለከታል፣ ይንቀሳቀሳል ወይም ድምፅ ያወጣል',
  'dev-4m-l-1': 'እንደ “ኦኦኦኦ”፣ “አአአአ” ያሉ የህፃናት ድምፆችን ያወጣል',
  'dev-4m-l-2': 'ሲያናግሩት በድምፅ መልስ ይሰጣል',
  'dev-4m-l-3': 'ወደ እርስዎ ድምፅ አቅጣጫ ራሱን ያዞራል',
  'dev-4m-c-1': 'ከራበው፣ ጡት ወይም የጡጦ ወተት ሲያይ አፉን ይከፍታል',
  'dev-4m-c-2': 'እጆቹን በፍላጎት ይመለከታል',
  'dev-4m-p-1': 'ሲያቅፉት ያለምንም ድጋፍ እራሱን ቀጥ አድርጎ ይይዛል',
  'dev-4m-p-2': 'አሻንጉሊት በእጁ ሲያስገቡለት ይይዛል',
  'dev-4m-p-3': 'አሻንጉሊቶችን ለመምታት እጁን ያወናጭፋል',
  'dev-4m-p-4': 'እጆቹን ወደ አፉ ይወስዳል',
  'dev-4m-p-5': 'በሆዱ በሚተኛበት ጊዜ በክርኖቹ/በክንዶቹ ይገፋል',
  'dev-6m-s-1': 'የሚያውቃቸውን ሰዎች ይለያል',
  'dev-6m-s-2': 'በመስተዋት ውስጥ እራሱን ማየት ይወዳል',
  'dev-6m-s-3': 'ይስቃል',
  'dev-6m-l-1': 'እርስዎ ድምፅ ሲያወጡ ተራ በተራ ድምፅ ያወጣል',
  'dev-6m-l-2': 'ምላሱን አውጥቶ በመንፋት ድምፅ ያወጣል',
  'dev-6m-l-3': 'የጩኸት/የደስታ ድምፆችን ያወጣል',
  'dev-6m-c-1': 'ነገሮችን ለመመርመር ወደ አፉ ያስገባል',
  'dev-6m-c-2': 'የፈለገውን አሻንጉሊት ለመያዝ እጁን ይዘረጋል',
  'dev-6m-c-3': 'ተጨማሪ ምግብ እንደማይፈልግ ለማሳየት ከንፈሩን ይዘጋል',
  'dev-6m-p-1': 'ከሆዱ ወደ ጀርባው ይገላበጣል',
  'dev-6m-p-2': 'በሆዱ በሚተኛበት ጊዜ እጆቹን ቀጥ አድርጎ ወደ ላይ ይገፋል',
  'dev-6m-p-3': 'በሚቀመጥበት ጊዜ እራሱን ለመደገፍ በእጆቹ ይመርኮዛል',
  'dev-9m-s-1': 'እንግዳ በሆኑ ሰዎች ፊት ይፈራል፣ ያፍራል ወይም ይጣበቃል',
  'dev-9m-s-2': 'እንደ ደስታ፣ ሀዘን፣ ቁጣ እና መደነቅ ያሉ የተለያዩ የፊት ገጽታዎችን ያሳያል',
  'dev-9m-s-3': 'ስሙ ሲጠራ ዘወር ብሎ ይመለከታል',
  'dev-9m-s-4': 'ጥለውት ሲሄዱ ምላሽ ይሰጣል (ይመለከታል፣ እጁን ይዘረጋል ወይም ያለቅሳል)',
  'dev-9m-s-5': 'ድብብቆሽ (አይነ ውርጅብኝ) ሲጫወቱት ፈገግ ይላል ወይም ይስቃል',
  'dev-9m-l-1': 'እንደ “ማማማማ” እና “ባባባባ” ያሉ የተለያዩ ድምፆችን ያወጣል',
  'dev-9m-l-2': 'እንዲታቀፍ እጆቹን ወደ ላይ ያነሳል',
  'dev-9m-c-1': 'ነገሮች ከዓይኑ ተሰውረው ሲወድቁ (እንደ ማንኪያ ወይም አሻንጉሊት) ይፈልጋል',
  'dev-9m-c-2': 'ሁለት ነገሮችን እርስ በእርስ ያጋጫል/ያጮኻል',
  'dev-9m-p-1': 'በራሱ ጥረት ወደ መቀመጥ ደረጃ ይመጣል',
  'dev-9m-p-2': 'ነገሮችን ከአንድ እጁ ወደ ሌላኛው እጁ ያዛውራል',
  'dev-9m-p-3': 'ምግብን ወደ እራሱ ለመሳብ ጣቶቹን እንደ መሰብሰቢያ ይጠቀማል',
  'dev-9m-p-4': 'ያለምንም ድጋፍ ይቀመጣል',
  'dev-12m-s-1': 'ከእርስዎ ጋር እንደ “እጅ ለእጅ ማጨብጨብ” (pat-a-cake) ያሉ ጨዋታዎችን ይጫወታል',
  'dev-12m-l-1': '“ቻው ቻው” ለማለት እጁን ያወናጭፋል',
  'dev-12m-l-2': 'ወላጆቹን “ማማ” ወይም “ዳዳ/ባባ” ወይም ሌላ ልዩ ስም አውጥቶ ይጠራል',
  'dev-12m-l-3': '“አይሆንም” የሚለውን ቃል ይረዳል (ሲሉበት ለጥቂት ጊዜ ይቆማል ወይም ድርጊቱን ያቆማል)',
  'dev-12m-c-1': 'አንድን ነገር እቃ ውስጥ ይከታል (ለምሳሌ መጫወቻ ኪዩብን ኩባያ ውስጥ መጨመር)',
  'dev-12m-c-2': 'ሲደብቁት ያየውን ነገር ይፈልጋል (ለምሳሌ ብርድ ልብስ ስር የተደበቀ አሻንጉሊት)',
  'dev-12m-p-1': 'ለመቆም እራሱን ወደ ላይ ይስባል',
  'dev-12m-p-2': 'የቤት እቃዎችን እየተደገፈ ይራመዳል',
  'dev-12m-p-3': 'ያለ ክዳን ካለው ኩባያ እርስዎ ይዘውለት ይጠጣል',
  'dev-12m-p-4': 'ትናንሽ ምግቦችን በአውራ ጣቱ እና በጠቋሚ ጣቱ መካከል በመቆንጠጥ ያነሳል',
  'dev-15m-s-1': 'ሲጫወት ሌሎች ልጆችን ይኮርጃል (ለምሳሌ ሌላ ልጅ ከአንድ እቃ ውስጥ አሻንጉሊት ሲያወጣ እሱም ያወጣል)',
  'dev-15m-s-2': 'የወደደውን ነገር ለእርስዎ ያሳይዎታል',
  'dev-15m-s-3': 'ሲደሰት ያጨበጭባል',
  'dev-15m-s-4': 'አሻንጉሊቶችን አቅፎ ይይዛል',
  'dev-15m-s-5': 'ፍቅሩን ያሳያል (ያቅፋል፣ ይጠጋል ወይም ይስማል)',
  'dev-15m-l-1': 'ከ“ማማ” ወይም “ዳዳ” ውጭ አንድ ወይም ሁለት ቃላትን ለመናገር ይሞክራል (ለምሳሌ ለኳስ “ኳ” ይላል)',
  'dev-15m-l-2': 'የሚያውቀውን ነገር በስም ሲጠሩት ወደ እቃው ይመለከታል',
  'dev-15m-l-3': 'በምልክት እና በቃል የሚሰጡ መመሪያዎችን ይከተላል (ለምሳሌ እጅዎን ዘርግተው “አሻንጉሊቱን ስጠኝ” ሲሉት ይሰጥዎታል)',
  'dev-15m-l-4': 'አንድ ነገር ለመጠየቅ ወይም እርዳታ ለማግኘት በጣቱ ይጠቁማል',
  'dev-15m-c-1': 'ነገሮችን በትክክለኛ መንገዳቸው ለመጠቀም ይሞክራል (እንደ ስልክ፣ ኩባያ ወይም መጽሐፍ)',
  'dev-15m-c-2': 'ቢያንስ ሁለት ትናንሽ እቃዎችን (እንደ መጫወቻ ኪዩቦች) በደራርቦ ያስቀምጣል',
  'dev-15m-p-1': 'በራሱ ጥቂት እርምጃዎችን ይራመዳል',
  'dev-15m-p-2': 'ምግብን በጣቶቹ ወደ አፉ ያጎርሳል',
  'dev-18m-s-1': 'ከእርስዎ ራቅ ይላል፣ ነገር ግን በአቅራቢያ መሆንዎን ለማረጋገጥ ዞሮ ያያል',
  'dev-18m-s-2': 'የሚስብ ነገር ለእርስዎ ለማሳየት በጣቱ ይጠቁማል',
  'dev-18m-s-3': 'እጆቹን ሊያስታጥቡት ሲሉ እጆቹን ይዘረጋል',
  'dev-18m-s-4': 'ከእርስዎ ጋር ሆኖ በመጽሐፍ ውስጥ ያሉ ጥቂት ገጾችን ይመለከታል',
  'dev-18m-s-5': 'እጁን በሸሚዝ እጅጌ ውስጥ በማስገባት ወይም እግሩን በማንሳት ልብስ እንዲያለብሱት ይረዳል',
  'dev-18m-l-1': 'ከ“ማማ” ወይም “ዳዳ” ውጪ ሶስት ወይም ከዚያ በላይ ቃላትን ለመናገር ይሞክራል',
  'dev-18m-l-2': 'ያለምንም የእጅ ምልክት የአንድ ደረጃ መመሪያዎችን ይከተላል (ለምሳሌ “ስጠኝ” ሲሉት አሻንጉሊቱን ይሰጥዎታል)',
  'dev-18m-c-1': 'የቤት ውስጥ ስራዎችን ሲሰሩ ይኮርጃል (ለምሳሌ በመጥረጊያ መጥረግ)',
  'dev-18m-c-2': 'በአሻንጉሊቶች በቀላል መንገድ ይጫወታል (ለምሳሌ የመጫወቻ መኪናን መግፋት)',
  'dev-18m-p-1': 'ማንንም ወይም ምንም ሳይደገፍ ይራመዳል',
  'dev-18m-p-2': 'ወረቀት ላይ ይጫጭራል',
  'dev-18m-p-3': 'ያለ ክዳን ካለው ኩባያ ይጠጣል (አንዳንዴ ሊያፈስ ይችላል)',
  'dev-18m-p-4': 'በጣቶቹ እራሱን ይመግባል',
  'dev-18m-p-5': 'ማንኪያ ለመጠቀም ይሞክራል',
  'dev-18m-p-6': 'ያለ እርዳታ ሶፋ ወይም ወንበር ላይ ይወጣል፣ ይወርዳል',
  'dev-24m-s-1': 'ሌሎች ሲጎዱ ወይም ሲያዝኑ ያስተውላል (ለምሳሌ ሰው ሲያለቅስ ዝም ይላል ወይም ያዝናል)',
  'dev-24m-s-2': 'በአዲስ ሁኔታ ውስጥ ምን አይነት ምላሽ መስጠት እንዳለበት ለማወቅ የእርስዎን ፊት ይመለከታል',
  'dev-24m-l-1': '“ድቡ የት አለ?” ብለው ሲጠይቁት በመጽሐፍ ውስጥ ያሉትን ነገሮች ያሳያል',
  'dev-24m-l-2': 'ቢያንስ ሁለት ቃላትን አንድ ላይ አጣምሮ ይናገራል (ለምሳሌ “ወተት እፈልጋለሁ”)',
  'dev-24m-l-3': 'እንዲያሳይዎት ሲጠይቁት ቢያንስ የሁለት የሰውነት ክፍሎችን ይጠቁማል',
  'dev-24m-l-4': 'ከእጅ ማወናጨፍ እና መጠቆም በተጨማሪ ተጨማሪ የምልክት ቋንቋዎችን ይጠቀማል (ለምሳሌ የአየር ላይ መሳም ወይም በአዎንታ ራስን መነቅነቅ)',
  'dev-24m-c-1': 'በአንድ እጁ እቃ ይዞ በሌላኛው እጁ ይጠቀማል (ለምሳሌ እቃውን ይዞ ክዳኑን መክፈት)',
  'dev-24m-c-2': 'በአሻንጉሊት ላይ ያሉ ማብሪያዎችን፣ ቁልፎችን ወይም ቦቶኖችን ለመጫን ይሞክራል',
  'dev-24m-c-3': 'በአንድ ጊዜ ከአንድ በላይ በሆኑ አሻንጉሊቶች ይጫወታል (ለምሳሌ የመጫወቻ ምግብን በመጫወቻ ሰሃን ላይ ማድረግ)',
  'dev-24m-p-1': 'ኳስ ይረግጣል',
  'dev-24m-p-2': 'ይሮጣል',
  'dev-24m-p-3': 'በጥቂት ደረጃዎች ላይ (ሳይሳብ) በምርኩዝ ወይም ያለ ምርኩዝ ወደ ላይ ይወጣል',
  'dev-24m-p-4': 'በማንኪያ ይበላል',
  'dev-30m-s-1': 'ከሌሎች ልጆች ጎን ይጫወታል፣ አንዳንዴም አብሯቸው ይጫወታል',
  'dev-30m-s-2': '“እየኝ!” በማለት ምን ማድረግ እንደሚችል ያሳይዎታል',
  'dev-30m-s-3': 'ሲነገረው ቀላል የዕለት ተዕለት ተግባራትን ይከተላል (ለምሳሌ “እቃዎችን የምንሰበስብበት ሰዓት ነው” ሲባል አሻንጉሊቶችን ለመሰብሰብ ያግዛል)',
  'dev-30m-l-1': 'ወደ 50 የሚጠጉ ቃላትን ይናገራል',
  'dev-30m-l-2': 'ድርጊትን የሚገልጽ ቃል ጨምሮ ሁለት ወይም ከዚያ በላይ ቃላትን ያጣምራል (ለምሳሌ “ውሻው ሮጠ”)',
  'dev-30m-l-3': 'በጣቱ ጠቁመው “ይህ ምንድን ነው?” ሲሉት በመጽሐፉ ውስጥ ያሉትን ነገሮች ይሰይማል',
  'dev-30m-l-4': 'እንደ “እኔ”፣ “እኛ” ያሉ ቃላትን ይጠቀማል',
  'dev-30m-c-1': 'ነገሮችን ለፈጠራ ጨዋታ ይጠቀማል (ለምሳሌ ለደብረ ቁስ/አሻንጉሊት ምግብ እንደሚመግብ አድርጎ መጫወቻ ኪዩብ መመገብ)',
  'dev-30m-c-2': 'ቀላል የችግር መፍታት ክህሎቶችን ያሳያል (ለምሳሌ አንድ ነገር ለመድረስ በትንሽ በርጩማ ላይ መቆም)',
  'dev-30m-c-3': 'የሁለት ደረጃ መመሪያዎችን ይከተላል (ለምሳሌ “አሻንጉሊቱን አስቀምጥና በሩን ዝጋው”)',
  'dev-30m-c-4': 'ቢያንስ አንድ ቀለም ማወቁን ያሳያል (ለምሳሌ “ቀዩ የትኛው ነው?” ሲባል ቀይ ቀለምን ይጠቁማል)',
  'dev-30m-p-1': 'ነገሮችን ለማሽከርከር እጆቹን ይጠቀማል (እንደ የበር እጀታዎችን ማዞር ወይም የእቃ ክዳን መክፈት)',
  'dev-30m-p-2': 'አንዳንድ ልብሶችን በራሱ ያወልቃል (እንደ ልቅ ያሉ ሱሪዎችን ወይም የተከፈተ ጃኬት)',
  'dev-30m-p-3': 'በሁለቱም እግሮቹ ከምድር ላይ ወደ ላይ ይዘልላል',
  'dev-30m-p-4': 'ሲያነቡለት የመጽሐፉን ገጾች በአንድ ጊዜ አንድ ገጽ ገልብጦ ያሳያል',
  'dev-36m-s-1': 'ጥለውት ሲሄዱ (ለምሳሌ ህጻናት ማቆያ ሲያደርሱት) በ10 ደቂቃ ውስጥ ይረጋጋል',
  'dev-36m-s-2': 'ሌሎችን ልጆች ያስተውላል እና አብሯቸው ለመጫወት ይቀላቀላል',
  'dev-36m-l-1': 'ቢያንስ ሁለት ጊዜ ሃሳብ በመለዋወጥ ከእርስዎ ጋር ጨዋታ ይጫወታል (ይነጋገራል)',
  'dev-36m-l-2': '“ማን”፣ “ምን”፣ “የት” ወይም “ለምን” የሚሉ ጥያቄዎችን ይጠይቃል (ለምሳሌ “እማማ/አባባ የት ነው?”)',
  'dev-36m-l-3': 'ሲጠየቅ በምስል ወይም በመጽሐፍ ላይ ምን እየተደረገ እንዳለ ይናገራል (ለምሳሌ “እየሮጠ ነው”፣ “እየበላ ነው”)',
  'dev-36m-l-4': 'ሲጠየቅ የመጀመሪያ ስሙን ይናገራል',
  'dev-36m-l-5': 'አብዛኛውን ጊዜ ሌሎች ሊረዱት በሚችሉት መልኩ በጥሩ ሁኔታ ይናገራል',
  'dev-36m-c-1': 'እንዴት እንደሚሰራ ሲያሳዩት ክብ ይስላል',
  'dev-36m-c-2': 'ሲያስጠነቅቁት ትኩስ ነገሮችን (እንደ ምድጃ) ከመንካት ይቆጠባል',
  'dev-36m-p-1': 'እንደ ትላልቅ ዶቃዎች ወይም መኮሮኒ ያሉ ነገሮችን በክር ይጎርዛል',
  'dev-36m-p-2': 'አንዳንድ ልብሶችን በራሱ ይለብሳል (እንደ ልቅ ሱሪ ወይም ጃኬት)',
  'dev-36m-p-3': 'ሹካ ይጠቀማል',
  'dev-48m-s-1': 'በሚጫወትበት ጊዜ ሌላ ነገር መስሎ ይተውናል (አስተማሪ, ልዕለ-ኃያል/ሱፐርሂሮ, ውሻ)',
  'dev-48m-s-2': 'በአቅራቢያው ልጅ ከሌለ አብሮ ለመጫወት ይጠይቃል (ለምሳሌ “ከአሌክስ ጋር መጫወት እችላለሁ?”)',
  'dev-48m-s-3': 'የተጎዱትን ወይም ያዘኑትን ያጽናናል (ለምሳሌ የሚያለቅስ ጓደኛን ማቀፍ)',
  'dev-48m-s-4': 'ከአደጋ ይቆጠባል (ለምሳሌ በመጫወቻ ቦታ ላይ በጣም ረጅም ከሆነ ቦታ ላይ አለመዝለል)',
  'dev-48m-s-5': '“ረዳት” መሆን ይወዳል',
  'dev-48m-s-6': 'ባለበት ቦታ ላይ በመመስረት ባህሪውን ይለውጣል (የአምልኮ ቦታ, ቤተ-መጻሕፍት, የመጫወቻ ሜዳ)',
  'dev-48m-l-1': 'አራት ወይም ከዚያ በላይ ቃላት ያሏቸውን ዓረፍተ ነገሮች ይናገራል',
  'dev-48m-l-2': 'ከዘፈን፣ ከታሪክ ወይም ከግጥም የተወሰኑ ቃላትን ይላል',
  'dev-48m-l-3': 'በዕለቱ ስለተከሰተ ቢያንስ አንድ ነገር ይናገራል (ለምሳሌ “ኳስ ተጫውቻለሁ”)',
  'dev-48m-l-4': 'ለቀላል ጥያቄዎች መልስ ይሰጣል (ለምሳሌ “ኮት ለምን ይጠቅማል?” ወይም “የቀለም እርሳስ ለምን ይጠቅማል?”)',
  'dev-48m-c-1': 'የአንዳንድ እቃዎችን ቀለሞች ይሰይማል',
  'dev-48m-c-2': 'በሚያውቀው ታሪክ ውስጥ ቀጥሎ ምን እንደሚመጣ ይናገራል',
  'dev-48m-c-3': 'ቢያንስ ሶስት የሰውነት ክፍሎች ያሉት የሰው ምስል ይስላል',
  'dev-48m-p-1': 'አብዛኛውን ጊዜ ትልቅ ኳስ ይይዛል',
  'dev-48m-p-2': 'በአዋቂዎች ቁጥጥር ስር እራሱ ምግብ ይጨምራል ወይም ውሃ ይቀዳል',
  'dev-48m-p-3': 'የአንዳንድ ልብሶችን ቁልፎች ይፈታል',
  'dev-48m-p-4': 'የቀለም እርሳስን ወይም እርሳስን በጣቶቹ እና በአውራ ጣቱ መካከል ይይዛል (በጨበጣ ሳይሆን)',
  'dev-60m-s-1': 'ከሌሎች ልጆች ጋር ጨዋታዎችን ሲጫወት ህጎችን ይከተላል ወይም ተራ ይጠብቃል',
  'dev-60m-s-2': 'ይዘፍናል፣ ይጨፍራል ወይም ለእርስዎ ድራማ ይሰራል',
  'dev-60m-s-3': 'በቤት ውስጥ ቀላል ስራዎችን ይሰራል (ለምሳሌ ካልሲዎችን ማጣመር ወይም ከበሉ በኋላ ማዕድ ማንሳት)',
  'dev-60m-l-1': 'የሰማውን ወይም የፈጠረውን ቢያንስ ሁለት ድርጊቶች ያሉትን ታሪክ ይናገራል (ለምሳሌ፡ “ድመት ዛፍ ላይ ተጣብቃ ነበር፣ ከዚያ እሳት አደጋ ሰራተኛው አዳናት”)',
  'dev-60m-l-2': 'መጽሐፍ ካነበቡለት ወይም ታሪክ ከነገሩት በኋላ ስለ ታሪኩ ቀላል ጥያቄዎችን ይመልሳል',
  'dev-60m-l-3': 'ከሶስት ጊዜ በላይ ሃሳብ በመለዋወጥ ንግግሩን ይቀጥላል',
  'dev-60m-l-4': 'ቀላል ተመሳሳይ ድምፅ ያላቸውን ቃላት (Rhymes) ይጠቀማል ወይም ይለያል',
  'dev-60m-c-1': 'እስከ 10 ይቆጥራል',
  'dev-60m-c-2': 'ሲጠቁሙለት ከ1 እስከ 5 ያሉ አንዳንድ ቁጥሮችን ይሰይማል',
  'dev-60m-c-3': 'ስለ ጊዜ የሚገልጹ ቃላትን ይጠቀማል (እንደ “ትናንት”፣ “ነገ”፣ “ጠዋት” ወይም “ማታ”)',
  'dev-60m-c-4': 'በተለያዩ ተግባራት ላይ ከ5 እስከ 10 ደቂቃ ትኩረቱን ይሰጣል (ለምሳሌ፡ የታሪክ ሰዓት ወይም የእጅ ስራዎች ሲሰሩ — በስልክ/ቴሌቪዥን የሚያሳልፈው ጊዜ አይቆጠርም)',
  'dev-60m-c-5': 'በስሙ ውስጥ ያሉ አንዳንድ ፊደላትን ይጽፋል',
  'dev-60m-c-6': 'ሲጠቁሙለት አንዳንድ ፊደላትን ይሰይማል',
  'dev-60m-p-1': 'የልብስ ቁልፎችን ይቆልፋል',
  'dev-60m-p-2': 'በአንድ እግሩ ያነክሳል/ይዘልላል',
};

const getCurrentLanguage = (): 'en' | 'am' =>
  i18n.language?.toLowerCase().startsWith('am') ? 'am' : 'en';

const getLocalizedQuestion = (id: string, fallback: string): string => {
  if (getCurrentLanguage() !== 'am') {
    return fallback;
  }

  return AMHARIC_QUESTION_OVERRIDES[id] ?? fallback;
};

const getLocalizedSubCategoryLabel = (subCategory: DevelopmentalSubCategory): string =>
  i18n.t(DEVELOPMENTAL_SUBCATEGORY_LABELS[subCategory]);

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
        group.questions.map((question, index) => {
          const id = getQuestionId(milestone.ageMonths, group.key, index);

          return {
            id,
          ageMonths: milestone.ageMonths,
          subCategory: group.key,
          subCategoryLabel: getLocalizedSubCategoryLabel(group.key),
          question: getLocalizedQuestion(id, question),
        };
        })
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
      group.questions.map((question, index) => {
        const id = getQuestionId(milestone.ageMonths, group.key, index);

        return {
          id,
          question: getLocalizedQuestion(id, question),
          ageMonths: milestone.ageMonths,
        };
      })
    )
    .slice(0, Math.max(limit, 0));
};
