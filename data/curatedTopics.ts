/**
 * Curated Topics - Pre-made curriculum structures for home page showcase
 * These provide a quick start - users click to see curriculum, then generate content
 */

import { CurriculumData } from '../types';

export interface CuratedTopic {
  id: string;
  title: string;
  tagline: string;
  imageKeyword: string; // Keyword for Wikimedia API image search
  imageUrl?: string; // Direct image URL if available
  curriculum: CurriculumData;
}

// Helper to build Wikimedia Commons API URL for image search
export function getWikimediaImageUrl(keyword: string): string {
  const params = new URLSearchParams({
    origin: '*',
    action: 'query',
    generator: 'search',
    gsrsearch: `${keyword} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '1',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '400',
    format: 'json'
  });
  return `https://commons.wikimedia.org/w/api.php?${params}`;
}

export const CURATED_TOPICS: CuratedTopic[] = [
  {
    id: 'manhattan-project',
    title: 'The Manhattan Project',
    tagline: 'The secret race that changed warfare forever',
    imageKeyword: 'atomic bomb mushroom cloud',
    imageUrl: 'https://ahf.nuclearmuseum.org/wp-content/uploads/2017/03/Manhattan_Project_emblem_4.png',
    curriculum: {
      title: 'The Manhattan Project: Building the Atomic Age',
      overview: 'Explore the secret World War II program that developed the first nuclear weapons, from scientific discoveries to ethical debates.',
      description: 'A journey through one of history\'s most consequential scientific endeavors',
      learningGoals: [
        'Understand the scientific principles behind nuclear fission',
        'Learn about key figures like Oppenheimer and Fermi',
        'Explore the ethical implications that still resonate today',
        'Analyze the geopolitical impact on the post-war world'
      ],
      modules: [
        { id: 'm1', title: 'The Road to Los Alamos', description: 'How Einstein\'s letter to Roosevelt sparked a secret revolution', slides: [{ id: 's1', title: 'Einstein\'s Warning', description: 'The letter that started it all' }, { id: 's2', title: 'Assembling the Geniuses', description: 'Recruiting the world\'s best minds' }, { id: 's3', title: 'The Secret City', description: 'Life in Los Alamos' }] },
        { id: 'm2', title: 'The Science of the Bomb', description: 'Understanding nuclear fission and chain reactions', slides: [{ id: 's1', title: 'Splitting the Atom', description: 'Nuclear fission explained' }, { id: 's2', title: 'Critical Mass', description: 'The physics of chain reactions' }, { id: 's3', title: 'Two Designs', description: 'Little Boy vs Fat Man' }] },
        { id: 'm3', title: 'Trinity and Beyond', description: 'The first test and the dawn of the atomic age', slides: [{ id: 's1', title: 'The Trinity Test', description: 'July 16, 1945 - the world changed' }, { id: 's2', title: 'Hiroshima and Nagasaki', description: 'The devastating reality' }, { id: 's3', title: 'The Aftermath', description: 'Oppenheimer\'s regret' }] },
        { id: 'm4', title: 'Legacy and Ethics', description: 'The lasting impact on science, politics, and morality', slides: [{ id: 's1', title: 'The Nuclear Arms Race', description: 'Cold War escalation' }, { id: 's2', title: 'Scientists and Conscience', description: 'The moral reckoning' }, { id: 's3', title: 'Modern Implications', description: 'Nuclear technology today' }] }
      ]
    }
  },
  {
    id: 'james-webb',
    title: 'James Webb Telescope',
    tagline: 'Seeing the universe like never before',
    imageKeyword: 'james webb space telescope',
    imageUrl: 'data:image/jpeg;base64,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',
    curriculum: {
      title: 'The James Webb Space Telescope: A New Eye on the Universe',
      overview: 'Discover how the most powerful space telescope ever built is revolutionizing our understanding of the cosmos.',
      description: 'From engineering marvel to cosmic discoveries',
      learningGoals: [
        'Understand JWST\'s groundbreaking technology',
        'Learn how infrared astronomy reveals hidden universe',
        'Explore the telescope\'s major discoveries',
        'Appreciate the engineering challenges overcome'
      ],
      modules: [
        { id: 'm1', title: 'Engineering the Impossible', description: 'How engineers built a 6.5-meter mirror that unfolds in space', slides: [{ id: 's1', title: 'The Sunshield', description: 'Keeping cool at -233°C' }, { id: 's2', title: 'The Golden Mirror', description: '18 hexagonal segments' }, { id: 's3', title: 'L2 Orbit', description: 'A million miles from Earth' }] },
        { id: 'm2', title: 'Seeing in Infrared', description: 'Why infrared light reveals what visible light cannot', slides: [{ id: 's1', title: 'Beyond Visible Light', description: 'The infrared spectrum' }, { id: 's2', title: 'Cosmic Redshift', description: 'Seeing ancient light' }, { id: 's3', title: 'Piercing Dust Clouds', description: 'Revealing stellar nurseries' }] },
        { id: 'm3', title: 'Cosmic Revelations', description: 'The breathtaking discoveries since launch', slides: [{ id: 's1', title: 'The Deep Field', description: 'Thousands of galaxies in a grain of sand' }, { id: 's2', title: 'Exoplanet Atmospheres', description: 'Detecting alien worlds' }, { id: 's3', title: 'The First Galaxies', description: 'Light from 13 billion years ago' }] },
        { id: 'm4', title: 'The Future of Space Observation', description: 'What JWST\'s mission means for astronomy\'s future', slides: [{ id: 's1', title: 'Planned Observations', description: 'The science ahead' }, { id: 's2', title: 'JWST\'s Legacy', description: 'Inspiring next-gen telescopes' }, { id: 's3', title: 'Your Place in the Cosmos', description: 'Connecting to the universe' }] }
      ]
    }
  },
  {
    id: 'van-gogh-art',
    title: 'The Art of Van Gogh',
    tagline: 'Inside the mind of a tortured genius',
    imageKeyword: 'starry night van gogh',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0969/9128/files/Self_portrait_with_grey_felt_-_4x6_2048x2048.jpg?v=1587471597',
    curriculum: {
      title: 'The Art of Vincent van Gogh: Passion, Pain, and Masterpieces',
      overview: 'Explore the extraordinary life and revolutionary techniques of history\'s most beloved Post-Impressionist painter, from his early struggles to his iconic masterpieces.',
      description: 'Art history meets psychology and human drama',
      learningGoals: [
        'Understand Van Gogh\'s unique artistic techniques and color theory',
        'Trace his artistic evolution from dark beginnings to vibrant expression',
        'Explore the connection between his mental struggles and creativity',
        'Analyze his most famous works including Starry Night and Sunflowers',
        'Appreciate his lasting influence on modern art'
      ],
      modules: [
        { id: 'm1', title: 'The Unlikely Artist', description: 'From failed preacher to revolutionary painter', slides: [{ id: 's1', title: 'Early Life and Struggles', description: 'The path to art was not straight' }, { id: 's2', title: 'The Potato Eaters', description: 'His dark Dutch period' }, { id: 's3', title: 'Discovery of Color', description: 'Moving to Paris changed everything' }, { id: 's4', title: 'Influence of Impressionists', description: 'Learning from the masters' }] },
        { id: 'm2', title: 'Revolutionary Techniques', description: 'How Van Gogh painted emotion itself', slides: [{ id: 's1', title: 'Impasto and Brushwork', description: 'Thick paint, bold strokes' }, { id: 's2', title: 'Color as Emotion', description: 'Yellow for hope, blue for despair' }, { id: 's3', title: 'Complementary Colors', description: 'Making paintings vibrate' }, { id: 's4', title: 'The Night Sky', description: 'Why Starry Night swirls' }] },
        { id: 'm3', title: 'Arles and the Asylum', description: 'The most productive and troubled years', slides: [{ id: 's1', title: 'The Yellow House', description: 'Dreams of an artist colony' }, { id: 's2', title: 'The Ear Incident', description: 'The famous breakdown' }, { id: 's3', title: 'Saint-Rémy', description: 'Painting from the asylum' }, { id: 's4', title: 'Letters to Theo', description: 'A window into his soul' }] },
        { id: 'm4', title: 'Legacy and Influence', description: 'From obscurity to the most valuable artist in history', slides: [{ id: 's1', title: 'Only One Sale', description: 'Fame after death' }, { id: 's2', title: 'Expressionism\'s Father', description: 'Inspiring generations' }, { id: 's3', title: 'Record Auction Prices', description: 'Why his art is priceless' }, { id: 's4', title: 'Van Gogh Today', description: 'Museums and cultural impact' }] }
      ]
    }
  },
  {
    id: 'chatgpt-explained',
    title: 'How ChatGPT Works',
    tagline: 'Understanding the AI that changed everything',
    imageUrl: 'https://play-lh.googleusercontent.com/lmG9HlI0awHie0cyBieWXeNjpyXvHPwDBb8MNOVIyp0P8VEh95AiBHtUZSDVR3HLe3A=w240-h480-rw',
    imageKeyword: 'artificial intelligence neural network',
    curriculum: {
      title: 'How ChatGPT Works: The Technology Behind the Revolution',
      overview: 'Demystify the AI technology powering ChatGPT, from neural networks to reinforcement learning from human feedback.',
      description: 'AI explained for curious minds',
      learningGoals: [
        'Understand transformer architecture basics',
        'Learn how language models predict text',
        'Explore RLHF and fine-tuning',
        'Appreciate capabilities and limitations'
      ],
      modules: [
        { id: 'm1', title: 'The Transformer Revolution', description: 'The architecture that made it all possible', slides: [{ id: 's1', title: 'Attention Is All You Need', description: 'The 2017 breakthrough' }, { id: 's2', title: 'Self-Attention Explained', description: 'How context is captured' }, { id: 's3', title: 'Scaling Laws', description: 'Why bigger is smarter' }] },
        { id: 'm2', title: 'Training a Language Model', description: 'From raw text to coherent responses', slides: [{ id: 's1', title: 'Pre-training on the Web', description: 'Learning from billions of words' }, { id: 's2', title: 'Next Token Prediction', description: 'The core objective' }, { id: 's3', title: 'Emergent Abilities', description: 'When scale creates magic' }] },
        { id: 'm3', title: 'RLHF: Making AI Helpful', description: 'Reinforcement learning from human feedback', slides: [{ id: 's1', title: 'The Alignment Problem', description: 'Raw models aren\'t helpful' }, { id: 's2', title: 'Human Preferences', description: 'Teaching what\'s good' }, { id: 's3', title: 'Reward Models', description: 'Automating human judgment' }] },
        { id: 'm4', title: 'Capabilities and Limits', description: 'What ChatGPT can and cannot do', slides: [{ id: 's1', title: 'Impressive Abilities', description: 'Coding, writing, reasoning' }, { id: 's2', title: 'Hallucinations', description: 'When AI makes things up' }, { id: 's3', title: 'The Future of LLMs', description: 'What\'s next for AI' }] }
      ]
    }
  },
  // {
  //   id: 'digestion',
  //   title: 'Digestion Explained',
  //   tagline: 'The incredible journey of your food',
  //   imageKeyword: 'human digestive system',
  //   curriculum: {
  //     title: 'Digestion Explained: The Remarkable Journey of Food',
  //     overview: 'Follow food through your digestive system, understanding each organ\'s role in breaking down and absorbing nutrients.',
  //     description: 'Biology meets your breakfast',
  //     learningGoals: [
  //       'Trace the complete digestive pathway',
  //       'Understand enzyme functions and nutrient absorption',
  //       'Learn about the gut microbiome',
  //       'Connect digestion to overall health'
  //     ],
  //     modules: [
  //       { id: 'm1', title: 'The Journey Begins', description: 'From mouth to stomach', slides: [{ id: 's1', title: 'Mechanical Breakdown', description: 'Chewing and saliva' }, { id: 's2', title: 'The Esophagus', description: 'Peristalsis in action' }, { id: 's3', title: 'Stomach Acids', description: 'Breaking down proteins' }] },
  //       { id: 'm2', title: 'The Small Intestine', description: 'Where the magic of absorption happens', slides: [{ id: 's1', title: 'Villi and Microvilli', description: 'Surface area secrets' }, { id: 's2', title: 'Enzyme Action', description: 'Chemical breakdown' }, { id: 's3', title: 'Nutrient Transport', description: 'Into the bloodstream' }] },
  //       { id: 'm3', title: 'The Gut Microbiome', description: 'Trillions of helpful bacteria', slides: [{ id: 's1', title: 'Bacterial Friends', description: 'Your inner ecosystem' }, { id: 's2', title: 'Fermentation', description: 'What microbes do' }, { id: 's3', title: 'Gut-Brain Axis', description: 'The surprising connection' }] },
  //       { id: 'm4', title: 'Digestion and Health', description: 'Keeping your digestive system happy', slides: [{ id: 's1', title: 'Common Issues', description: 'When things go wrong' }, { id: 's2', title: 'Diet and Digestion', description: 'Foods that help' }, { id: 's3', title: 'The Healthy Gut', description: 'Best practices' }] }
  //     ]
  //   }
  // },
  // {
  //   id: 'dangerous-philosophers',
  //   title: 'Dangerous Philosophers',
  //   tagline: 'Ideas that shook the world',
  //   imageKeyword: 'nietzsche portrait',
  //   curriculum: {
  //     title: 'The Most Dangerous Philosophers in History',
  //     overview: 'Explore thinkers whose ideas challenged power, morality, and reality itself - often at great personal cost.',
  //     description: 'Philosophy that changed (and threatened) civilization',
  //     learningGoals: [
  //       'Understand revolutionary philosophical ideas',
  //       'See how philosophy shaped political movements',
  //       'Explore the personal costs of dangerous thinking',
  //       'Evaluate the lasting impact of radical ideas'
  //     ],
  //     modules: [
  //       { id: 'm1', title: 'Socrates: The First Martyr', description: 'Questioning everything, even unto death', slides: [{ id: 's1', title: 'The Socratic Method', description: 'Making people uncomfortable' }, { id: 's2', title: 'Corrupting the Youth', description: 'The charges against him' }, { id: 's3', title: 'The Hemlock Cup', description: 'Dying for ideas' }] },
  //       { id: 'm2', title: 'Nietzsche: God is Dead', description: 'The philosopher who destroyed traditional morality', slides: [{ id: 's1', title: 'Beyond Good and Evil', description: 'Revaluing all values' }, { id: 's2', title: 'The Übermensch', description: 'Creating new meaning' }, { id: 's3', title: 'Misuse and Legacy', description: 'How ideas get twisted' }] },
  //       { id: 'm3', title: 'Marx: Revolution\'s Architect', description: 'The philosopher who launched a thousand revolutions', slides: [{ id: 's1', title: 'Class Struggle', description: 'History as conflict' }, { id: 's2', title: 'Das Kapital', description: 'Critique of capitalism' }, { id: 's3', title: 'Real-World Impact', description: 'From theory to revolution' }] },
  //       { id: 'm4', title: 'Modern Dangerous Thinkers', description: 'Contemporary philosophers disrupting our worldview', slides: [{ id: 's1', title: 'Foucault and Power', description: 'Everywhere and invisible' }, { id: 's2', title: 'Žižek Today', description: 'Pop culture critique' }, { id: 's3', title: 'Why Philosophy Matters', description: 'Ideas still shake worlds' }] }
  //     ]
  //   }
  // },
  // {
  //   id: 'disturbing-mysteries',
  //   title: 'Disturbing Mysteries',
  //   tagline: 'Unsolved cases that haunt us',
  //   imageKeyword: 'mystery detective investigation',
  //   curriculum: {
  //     title: 'Disturbing Mysteries: Cases That Defy Explanation',
  //     overview: 'Investigate the world\'s most baffling unsolved mysteries, from disappearances to unexplained phenomena.',
  //     description: 'Where logic meets the inexplicable',
  //     learningGoals: [
  //       'Analyze famous unsolved cases',
  //       'Understand investigative techniques and their limits',
  //       'Explore psychological aspects of mystery-seeking',
  //       'Evaluate evidence critically'
  //     ],
  //     modules: [
  //       { id: 'm1', title: 'Vanished Without Trace', description: 'Disappearances that defy explanation', slides: [{ id: 's1', title: 'The Dyatlov Pass', description: '9 hikers, no answers' }, { id: 's2', title: 'Flight MH370', description: 'A plane lost in the digital age' }, { id: 's3', title: 'DB Cooper', description: 'The only unsolved hijacking' }] },
  //       { id: 'm2', title: 'Cryptic Codes', description: 'Messages no one can decipher', slides: [{ id: 's1', title: 'The Zodiac Killer', description: 'Ciphers that taunt' }, { id: 's2', title: 'Voynich Manuscript', description: 'An unreadable book' }, { id: 's3', title: 'Kryptos at CIA', description: 'The sculpture no one solved' }] },
  //       { id: 'm3', title: 'Unexplained Phenomena', description: 'Events that challenge our understanding', slides: [{ id: 's1', title: 'The Wow! Signal', description: '72 seconds from space' }, { id: 's2', title: 'Tunguska Event', description: 'The explosion with no crater' }, { id: 's3', title: 'Ball Lightning', description: 'Science still puzzled' }] },
  //       { id: 'm4', title: 'The Psychology of Mystery', description: 'Why we\'re drawn to the unsolved', slides: [{ id: 's1', title: 'Pattern Seeking', description: 'The brain craves answers' }, { id: 's2', title: 'Conspiracy Thinking', description: 'When explanations go too far' }, { id: 's3', title: 'Living with Uncertainty', description: 'Accepting the unknown' }] }
  //     ]
  //   }
  // },
  // {
  //   id: 'coffee-science',
  //   title: 'The Science of Coffee',
  //   tagline: 'From bean to perfect brew',
  //   imageKeyword: 'coffee beans roasting',
  //   curriculum: {
  //     title: 'The Science of Coffee: Chemistry, Culture, and the Perfect Cup',
  //     overview: 'Master the fascinating science behind coffee - from the chemistry of roasting to the physics of extraction, and learn to brew the perfect cup.',
  //     description: 'Where chemistry meets your morning ritual',
  //     learningGoals: [
  //       'Understand the chemistry of coffee beans and roasting',
  //       'Master the science of extraction for optimal flavor',
  //       'Learn about different brewing methods and their physics',
  //       'Explore the global coffee trade and sustainability',
  //       'Develop skills to brew better coffee at home'
  //     ],
  //     modules: [
  //       { id: 'm1', title: 'The Coffee Plant', description: 'From cherry to green bean', slides: [{ id: 's1', title: 'Arabica vs Robusta', description: 'The two main species' }, { id: 's2', title: 'Growing Regions', description: 'Terroir and flavor profiles' }, { id: 's3', title: 'Processing Methods', description: 'Washed, natural, and honey' }, { id: 's4', title: 'The Global Trade', description: 'Coffee\'s economic impact' }] },
  //       { id: 'm2', title: 'The Roasting Transformation', description: 'How heat creates 800+ flavor compounds', slides: [{ id: 's1', title: 'The Maillard Reaction', description: 'Chemistry of browning' }, { id: 's2', title: 'First and Second Crack', description: 'Key roasting stages' }, { id: 's3', title: 'Light vs Dark Roasts', description: 'Flavor chemistry differences' }, { id: 's4', title: 'Freshness and Storage', description: 'When beans taste best' }] },
  //       { id: 'm3', title: 'Extraction Science', description: 'The physics of brewing the perfect cup', slides: [{ id: 's1', title: 'The Ideal Extraction', description: '18-22% is the sweet spot' }, { id: 's2', title: 'Variables That Matter', description: 'Grind, time, temperature, ratio' }, { id: 's3', title: 'Under and Over Extraction', description: 'Diagnosing taste problems' }, { id: 's4', title: 'Water Chemistry', description: 'Why water matters so much' }] },
  //       { id: 'm4', title: 'Brewing Methods Compared', description: 'The science behind each method', slides: [{ id: 's1', title: 'Pour Over', description: 'Clarity and control' }, { id: 's2', title: 'Espresso', description: 'Pressure and concentration' }, { id: 's3', title: 'French Press', description: 'Full immersion brewing' }, { id: 's4', title: 'Your Perfect Cup', description: 'Putting it all together' }] }
  //     ]
  //   }
  // }
];
