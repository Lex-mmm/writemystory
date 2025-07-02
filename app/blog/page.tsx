'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import Link from 'next/link';

const blogPosts = [
  {
    id: 'waarom-levensverhalen-belangrijk-zijn',
    title: 'Waarom Levensverhalen Zo Belangrijk Zijn Voor Families',
    excerpt: 'Ontdek waarom het vastleggen van levensverhalen niet alleen nostalgie is, maar een essentiële manier om familiebanden te versterken en wijsheid door te geven.',
    date: '2024-12-15',
    readTime: '5 min',
    image: '/images/blog/family-stories.jpg',
    tags: ['Familie', 'Herinneringen', 'Legacy'],
  },
  {
    id: 'tips-voor-biografieen-schrijven',
    title: '10 Tips Voor Het Schrijven Van Een Meeslepende Biografie',
    excerpt: 'Praktische tips en trucs om van jouw levensverhaal een boeiend verhaal te maken dat lezers van begin tot eind vasthoudt.',
    date: '2024-12-10',
    readTime: '7 min',
    image: '/images/blog/writing-tips.jpg',
    tags: ['Schrijftips', 'Biografie', 'Storytelling'],
  },
  {
    id: 'ai-in-biografieen',
    title: 'Hoe AI Helpt Bij Het Schrijven Van Authentieke Levensverhalen',
    excerpt: 'Leer hoe moderne AI-technologie biografieschrijvers helpt om betere vragen te stellen en verhalen te structureren.',
    date: '2024-12-05',
    readTime: '6 min',
    image: '/images/blog/ai-writing.jpg',
    tags: ['AI', 'Technologie', 'Innovatie'],
  },
  {
    id: 'memorial-verhalen',
    title: 'Memorial Verhalen: Hoe Je Een Dierbare Eert Met Woorden',
    excerpt: 'Gevoelige richtlijnen voor het schrijven van memorial verhalen die de nagedachtenis van geliefden op een respectvolle manier eren.',
    date: '2024-11-28',
    readTime: '8 min',
    image: '/images/blog/memorial.jpg',
    tags: ['Memorial', 'Rouw', 'Herinnering'],
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Verhalen, Tips & Inspiratie
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ontdek hoe je jouw levensverhaal of dat van je dierbaren kunt vastleggen, 
              deel en koesteren. Van schrijftips tot familieverhalen.
            </p>
          </div>

          {/* Featured Article */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/2">
                <div className="h-64 md:h-full bg-blue-100 flex items-center justify-center">
                  <span className="text-6xl">📖</span>
                </div>
              </div>
              <div className="md:w-1/2 p-8">
                <div className="text-sm text-blue-600 font-medium mb-2">
                  UITGELICHT ARTIKEL
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {blogPosts[0].title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {blogPosts[0].excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(blogPosts[0].date).toLocaleDateString('nl-NL')}</span>
                  <span>{blogPosts[0].readTime} leestijd</span>
                </div>
                <Link 
                  href={`/blog/${blogPosts[0].id}`}
                  className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Lees artikel
                </Link>
              </div>
            </div>
          </div>

          {/* Blog Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl">
                    {post.tags.includes('AI') ? '🤖' : 
                     post.tags.includes('Memorial') ? '🕊️' : 
                     post.tags.includes('Familie') ? '👨‍👩‍👧‍👦' : '✍️'}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{new Date(post.date).toLocaleDateString('nl-NL')}</span>
                    <span>{post.readTime} leestijd</span>
                  </div>
                  <Link 
                    href={`/blog/${post.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Lees meer →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="bg-white rounded-lg shadow-md p-8 mt-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Blijf op de hoogte
            </h3>
            <p className="text-gray-600 mb-6">
              Ontvang tips, inspiratie en updates over WriteMyStory.ai direct in je inbox.
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Je email adres"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Aanmelden
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
