import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import ChatWidget from '../../../components/chat/ChatWidget';

function getYoutubeEmbed(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function LandingPage() {
  const { doctorId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/landing-page/public/${doctorId}`)
      .then(r => setData(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;
  if (notFound) return <div className="min-h-screen flex items-center justify-center text-gray-500">Página não encontrada.</div>;

  const primary   = data.settings?.primaryColor   || '#3B82F6';
  const secondary = data.settings?.secondaryColor || '#06B6D4';
  const isDark    = data.settings?.themeMode === 'dark';

  const hero  = data.sections?.find(s => s.sectionKey === 'hero');
  const about = data.sections?.find(s => s.sectionKey === 'about');
  const images = data.media?.filter(m => m.type === 'image') || [];
  const videos = data.media?.filter(m => m.type === 'video') || [];

  const whatsappUrl = data.whatsappNumber
    ? `https://wa.me/55${data.whatsappNumber.replace(/\D/g, '')}`
    : null;

  return (
    <div className={isDark ? 'dark' : ''} style={{ '--color-primary': primary, '--color-secondary': secondary }}>
      <div className={`min-h-screen font-sans ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>

        {/* Hero */}
        <section style={{ background: `linear-gradient(135deg, ${primary}22 0%, ${secondary}22 100%)` }}
          className="relative py-24 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
            {data.profilePhotoUrl && (
              <img src={data.profilePhotoUrl} alt={data.name}
                className="w-40 h-40 rounded-full object-cover shadow-xl border-4 border-white flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: primary }}>
                {data.specialty}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {hero?.title || data.name}
              </h1>
              {hero?.body && (
                <p className={`mt-4 text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {hero.body}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-8">
                <a href="#agendar"
                  style={{ background: primary }}
                  className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition">
                  Agendar Consulta
                </a>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer"
                    className="px-6 py-3 rounded-xl font-semibold border-2 hover:opacity-80 transition"
                    style={{ borderColor: primary, color: primary }}>
                    💬 Falar com o médico
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sobre */}
        {about?.body && (
          <section className={`py-20 px-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">{about.title || 'Sobre'}</h2>
              <p className={`text-lg leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {about.body}
              </p>
            </div>
          </section>
        )}

        {/* Serviços */}
        {data.services?.length > 0 && (
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-10 text-center">Serviços</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.services.map(sv => (
                  <div key={sv.id}
                    className={`rounded-2xl p-6 border transition-shadow hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="font-semibold text-lg mb-2">{sv.name}</h3>
                    {sv.price && (
                      <p className="text-2xl font-bold mb-2" style={{ color: primary }}>
                        R$ {Number(sv.price).toFixed(2)}
                      </p>
                    )}
                    {sv.acceptsInsurance && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        ✓ Aceita convênio
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Convênios */}
        {data.insurancePlans?.length > 0 && (
          <section className={`py-16 px-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Convênios Aceitos</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {data.insurancePlans.map(p => (
                  <span key={p.id}
                    className={`px-4 py-2 rounded-full text-sm font-medium border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Galeria de fotos */}
        {images.length > 0 && (
          <section className="py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-10 text-center">Galeria</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map(img => (
                  <div key={img.id} className="rounded-2xl overflow-hidden aspect-square bg-gray-100">
                    <img src={img.url} alt={img.caption} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Vídeos */}
        {videos.length > 0 && (
          <section className={`py-20 px-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-10 text-center">Vídeos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map(v => {
                  const embed = getYoutubeEmbed(v.url);
                  return embed ? (
                    <div key={v.id} className="rounded-2xl overflow-hidden aspect-video shadow-lg">
                      <iframe src={embed} title={v.caption} className="w-full h-full" allowFullScreen />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </section>
        )}

        {/* CTA + Chat widget placeholder */}
        <section id="agendar" className="py-24 px-6 text-center"
          style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pronto para agendar?</h2>
          <p className="text-white/80 text-lg mb-8">Nossa IA responde na hora — sem espera.</p>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-2xl shadow-xl hover:opacity-90 transition text-lg">
              💬 Falar no WhatsApp
            </a>
          )}
        </section>

        {/* Footer */}
        <footer className={`py-8 text-center text-sm ${isDark ? 'bg-gray-950 text-gray-500' : 'bg-white text-gray-400'}`}>
          Powered by <span className="font-semibold" style={{ color: primary }}>Fast Atendimento</span>
        </footer>

        <ChatWidget
          doctorId={doctorId}
          whatsappNumber={data.whatsappNumber}
          primaryColor={primary}
        />
      </div>
    </div>
  );
}