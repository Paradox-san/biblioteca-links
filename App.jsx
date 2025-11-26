import React, { useState, useEffect, useRef } from "react";

// Biblioteca Digital de Links — Melhorada
export default function App() {
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const inputRef = useRef(null);

  // Carrega links do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem("linkLibrary");
    if (saved) setLinks(JSON.parse(saved));
    inputRef.current?.focus();
  }, []);

  // Salva links no localStorage sempre que mudam
  useEffect(() => {
    localStorage.setItem("linkLibrary", JSON.stringify(links));
  }, [links]);

  // Tema escuro manual
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Função para detectar categoria
  function detectCategory(url) {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
    if (url.includes("tiktok.com")) return "TikTok";
    if (url.includes("instagram.com")) return "Instagram";
    if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter";
    if (url.includes("vimeo.com")) return "Vimeo";
    return "Outros";
  }

  // Player embed melhorado
  function getEmbed(url) {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let id = url.split("v=")[1] || url.split("youtu.be/")[1];
      if (id?.includes("&")) id = id.split("&")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes("tiktok.com")) {
      // Exemplo: https://www.tiktok.com/@user/video/1234567890
      const match = url.match(/tiktok\.com\/@.*?\/video\/(\d+)/);
      if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
    if (url.includes("vimeo.com")) {
      const id = url.split("vimeo.com/")[1];
      return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  }

  // Valida link simples
  function isValidHttpUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  // Função de adicionar link (com validação, prevenção e loading seguro)
  async function addLink(e) {
    e.preventDefault();
    setError("");
    if (!url.trim()) {
      setError("Por favor, cole um link.");
      return;
    }
    if (!isValidHttpUrl(url)) {
      setError("Link inválido.");
      return;
    }
    if (links.find((l) => l.url === url)) {
      setError("Este link já foi adicionado.");
      return;
    }

    setLoading(true);
    let mounted = true; // Flag para evitar atualização estado em unmount

    try {
      const res = await fetch(
        `https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();

      if (!mounted) return;

      const newLink = {
        id: Date.now(),
        url,
        category: detectCategory(url),
        title: data.title || "Sem título",
        description: data.description || "Sem descrição",
        image: data.images && data.images.length > 0 ? data.images[0] : null,
        embed: getEmbed(url),
        tags: [],
      };

      setLinks((prev) => [newLink, ...prev]);
      setUrl("");
      inputRef.current?.focus();
    } catch (err) {
      if (mounted) setError("Erro ao buscar informações do link.");
      console.error(err);
    }
    setLoading(false);

    return () => { mounted = false; };
  }

  // Remove link
  function removeLink(id) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  // Busca filtrada
  const filtered = links.filter((l) =>
    (l.title + l.description + l.url + l.category)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className={`p-6 max-w-4xl mx-auto min-h-screen transition-all ${dark ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Biblioteca de Links</h1>
        <button
          onClick={() => setDark((d) => !d)}
          className={`rounded px-3 py-1 ml-2 border transition-colors ${dark ? "bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700" : "bg-white border-gray-300 text-gray-900 hover:bg-gray-200"}`}
          title="Alternar modo claro/escuro"
        >
          {dark ? "🌞 Claro" : "🌙 Escuro"}
        </button>
      </div>

      <input
        placeholder="Buscar..."
        className={`w-full p-2 mb-4 rounded border transition ${dark ? "bg-gray-800 border-gray-700" : "bg-gray-200 border-gray-400"}`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <form onSubmit={addLink} className="flex gap-2 mb-6">
        <input
          ref={inputRef}
          className={`flex-1 p-2 rounded border transition ${dark ? "bg-gray-800 border-gray-700" : "bg-gray-200 border-gray-400"}`}
          placeholder="Cole um link aqui..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
          disabled={loading}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          disabled={loading}
        >
          {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </form>

      {error && (
        <div className="mb-4 text-red-500 font-medium transition animate-fadeIn">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((link) => (
          <div
            key={link.id}
            className={`rounded-xl shadow border animate-fadeIn p-4 transition-all ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
          >
            <span className="text-xs text-gray-400 block mb-2">{link.category}</span>

            {/* Imagem / Preview */}
            {link.image && !link.embed && (
              <img
                src={link.image}
                alt="thumb"
                className="rounded mb-3 w-full max-h-60 object-cover"
              />
            )}

            {/* Player embutido */}
            {link.embed && (
              <iframe
                src={link.embed}
                className="w-full rounded mb-3 h-64"
                allowFullScreen
                title="Player"
              ></iframe>
            )}

            <h2 className="text-xl font-semibold">{link.title}</h2>
            <p className="text-sm mb-2">{link.description}</p>

            <div className="flex justify-between items-center mt-3">
              <a
                href={link.url}
                
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline font-medium"
              >
                Abrir
              </a>
              <button
                onClick={() => removeLink(link.id)}
                className="text-red-400 hover:text-red-300 font-medium ml-3"
                title="Remover"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="text-center text-gray-400 italic py-12 animate-fadeIn">
            Nenhum link encontrado.
          </div>
        )}
      </div>
    </div>
  );
}