const map = L.map('map').setView([-23.3056, -51.1691], 14);
let estacionamentosData = [];

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const iconeEstacionamento = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20]
});

// Carrega os estacionamentos da região central
const query = `
[out:json][timeout:25];
(
  node["amenity"="parking"](around:1000,-23.3056,-51.1691);
  way["amenity"="parking"](around:1000,-23.3056,-51.1691);
  relation["amenity"="parking"](around:1000,-23.3056,-51.1691);
);
out center;
`;

fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
})
.then(response => response.json())
.then(data => {
    data.elements.forEach(element => {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        if (lat && lon) {
            const nome = element.tags?.name || "Estacionamento";
            estacionamentosData.push({
                nome,
                lat,
                lon,
                preco: "R$ 5,00",
                vagas: Math.floor(Math.random() * 20 + 5)
            });

            L.marker([lat, lon], { icon: iconeEstacionamento })
                .addTo(map)
                .bindPopup(`<strong>${nome}</strong>`);
        }
    });
});

const modal = document.getElementById("modal");
const modalClose = document.querySelector(".close");
const listaEstacionamentos = document.getElementById("lista-estacionamentos");
const botaoBuscar = document.querySelector(".botaoBuscar");
const inputEndereco = document.getElementById("campoBusca"); // Campo de entrada do endereço

modalClose.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

botaoBuscar.onclick = () => {
    const endereco = inputEndereco.value; // Obtém o endereço do campo de entrada
    if (!endereco) {
        alert("Por favor, insira um endereço.");
        return;
    }

    // Busca as coordenadas do endereço usando a API Nominatim
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 16);

                // Busca estacionamentos públicos próximos ao endereço
                const queryPublicos = `
                [out:json][timeout:25];
                (
                  node["amenity"="parking"](around:1000,${lat},${lon});
                  way["amenity"="parking"](around:1000,${lat},${lon});
                  relation["amenity"="parking"](around:1000,${lat},${lon});
                );
                out center;
                `;

                fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    body: queryPublicos
                })
                .then(response => response.json())
                .then(data => {
                    // Remove os marcadores anteriores
                    estacionamentosData = [];
                    map.eachLayer(layer => {
                        if (layer instanceof L.Marker && layer.options.icon === iconeEstacionamento) {
                            map.removeLayer(layer);
                        }
                    });

                    // Adiciona os novos estacionamentos públicos ao mapa
                    data.elements.forEach(element => {
                        const lat = element.lat || element.center?.lat;
                        const lon = element.lon || element.center?.lon;
                        if (lat && lon) {
                            const nome = element.tags?.name || "Estacionamento Público";
                            estacionamentosData.push({
                                nome,
                                lat,
                                lon,
                                preco: "Gratuito",
                                vagas: Math.floor(Math.random() * 20 + 5)
                            });

                            L.marker([lat, lon], { icon: iconeEstacionamento })
                                .addTo(map)
                                .bindPopup(`<strong>${nome}</strong><br>💰 <strong>Preço:</strong> Gratuito<br>📌 <strong>Vagas disponíveis:</strong> ${Math.floor(Math.random() * 20 + 5)}`);
                        }
                    });

                    // Exibe os estacionamentos no modal
                    mostrarModal(estacionamentosData);
                })
                .catch(err => console.error("Erro ao buscar estacionamentos públicos:", err));
            } else {
                alert("Endereço não encontrado. Tente novamente.");
            }
        })
        .catch(err => console.error("Erro ao buscar endereço:", err));
};

function mostrarModal(lista) {
    listaEstacionamentos.innerHTML = '';
    lista.forEach(e => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${e.nome}</strong><br>
            💰 <strong>Preço por hora:</strong> ${e.preco}<br>
            📌 <strong>Vagas disponíveis:</strong> ${e.vagas}
        `;
        listaEstacionamentos.appendChild(li);
    });
    modal.style.display = "block";
}
