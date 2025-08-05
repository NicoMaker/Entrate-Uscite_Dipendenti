# Sistema Gestione Presenze Dipendenti

Un sistema completo per la gestione delle presenze dei dipendenti con interfaccia web moderna e funzionalità avanzate.

## 🚀 Caratteristiche

### 👥 Gestione Utenti
- **Ruoli multipli**: Admin, Responsabile, Dipendente
- **Gestione completa utenti**: Creazione, modifica, eliminazione
- **Associazione utenti-dipendenti**
- **Autenticazione sicura** con password criptate

### 📊 Dashboard e Statistiche
- **Dashboard in tempo reale** con statistiche live
- **Grafici interattivi** per visualizzare i dati
- **Statistiche mensili** dettagliate
- **Report personalizzabili**

### ⏰ Gestione Presenze
- **Registrazione entrata/uscita** con timestamp
- **Storico presenze** completo
- **Controllo duplicati** per evitare registrazioni multiple
- **Calcolo automatico** ore lavorate

### 📋 Gestione Richieste
- **Sistema richieste** per ferie, permessi, malattia
- **Workflow di approvazione** con stati multipli
- **Notifiche in tempo reale**
- **Storico richieste** completo

### 👨‍💼 Area Amministrativa
- **Gestione completa dipendenti**
- **Modifica ruoli** e permessi
- **Report avanzati** e export dati
- **Monitoraggio sistema** in tempo reale

## 🛠️ Tecnologie Utilizzate

### Backend
- **Node.js** con Express.js
- **SQLite** per il database
- **bcrypt** per la crittografia password
- **CORS** per la gestione cross-origin

### Frontend
- **HTML5** e **CSS3** moderni
- **Tailwind CSS** per il design
- **JavaScript ES6+** con async/await
- **Chart.js** per i grafici
- **Font Awesome** per le icone

## 📦 Installazione

### Prerequisiti
- Node.js (versione 16 o superiore)
- npm o yarn

### Passi di Installazione

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd Entrate-Uscite_Dipendenti
   ```

2. **Installa le dipendenze del backend**
   ```bash
   cd backend
   npm install
   ```

3. **Avvia il server**
   ```bash
   npm start
   ```

4. **Apri il browser**
   - Vai su: `http://localhost:3000`
   - Verrai reindirizzato alla pagina di login

## 🔐 Credenziali di Accesso

### Admin (Predefinito)
- **Username**: `admin`
- **Password**: `Admin123`

### Funzionalità Admin
- Gestione completa utenti e dipendenti
- Modifica ruoli e permessi
- Visualizzazione di tutte le statistiche
- Gestione richieste di tutti i dipendenti

## 📱 Utilizzo

### 1. Accesso al Sistema
- Apri il browser e vai su `http://localhost:3000`
- Inserisci le credenziali admin
- Seleziona il ruolo appropriato

### 2. Dashboard Principale
- **Statistiche in tempo reale**
- **Presenze di oggi**
- **Richieste in attesa**
- **Azioni rapide**

### 3. Gestione Presenze (Dipendenti)
- **Registra entrata**: Clicca su "Entrata" per registrare l'arrivo
- **Registra uscita**: Clicca su "Uscita" per registrare la partenza
- **Visualizza storico**: Controlla le tue presenze passate

### 4. Gestione Richieste
- **Nuova richiesta**: Compila il form per ferie/permessi
- **Stato richieste**: Monitora l'approvazione delle tue richieste
- **Storico**: Visualizza tutte le richieste inviate

### 5. Area Amministrativa
- **Gestione Utenti**: Crea, modifica, elimina utenti
- **Gestione Dipendenti**: Gestisci i profili dipendenti
- **Report**: Genera report personalizzati
- **Statistiche**: Analizza i dati del sistema

## 🗄️ Struttura Database

### Tabelle Principali
- **Dipendenti**: Informazioni personali e lavorative
- **Utenti**: Credenziali di accesso e ruoli
- **Presenze**: Registrazione entrate/uscite
- **Richieste**: Sistema richieste e approvazioni
- **Turni**: Gestione turni di lavoro

## 🔧 Configurazione

### Variabili d'Ambiente
Il sistema utilizza configurazioni predefinite, ma puoi personalizzare:

```javascript
// In server.js
const PORT = process.env.PORT || 3000;
const dbPath = process.env.DB_PATH || "presenze.db";
```

### Personalizzazione
- **Colori tema**: Modifica le classi Tailwind CSS
- **Logo**: Sostituisci le icone Font Awesome
- **Configurazione**: Modifica i parametri in `server.js`

## 📊 API Endpoints

### Autenticazione
- `POST /api/login` - Login utente

### Gestione Utenti
- `GET /api/users` - Lista utenti
- `POST /api/users` - Crea utente
- `PUT /api/users/:id` - Modifica utente
- `DELETE /api/users/:id` - Elimina utente

### Gestione Dipendenti
- `GET /api/dipendenti` - Lista dipendenti
- `POST /api/dipendenti` - Crea dipendente
- `PUT /api/dipendenti/:id` - Modifica dipendente
- `DELETE /api/dipendenti/:id` - Elimina dipendente

### Gestione Presenze
- `POST /api/presenze/entrata` - Registra entrata
- `POST /api/presenze/uscita` - Registra uscita
- `GET /api/presenze/oggi` - Presenze di oggi
- `GET /api/presenze/dipendente/:id` - Storico dipendente
- `GET /api/presenze/statistiche` - Statistiche presenze

### Gestione Richieste
- `GET /api/richieste` - Lista richieste
- `POST /api/richieste` - Crea richiesta
- `PUT /api/richieste/:id` - Aggiorna stato richiesta

### Dashboard
- `GET /api/dashboard/stats` - Statistiche dashboard

## 🚀 Deployment

### Produzione
1. **Configura il database** per l'ambiente di produzione
2. **Imposta le variabili d'ambiente** appropriate
3. **Configura un reverse proxy** (nginx, Apache)
4. **Usa PM2** per la gestione dei processi

```bash
npm install -g pm2
pm2 start server.js --name "gestione-presenze"
pm2 startup
pm2 save
```

### Docker (Opzionale)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Sicurezza

### Implementazioni di Sicurezza
- **Password criptate** con bcrypt
- **Validazione input** lato server
- **CORS configurato** per sicurezza
- **SQL injection protection** con prepared statements
- **Autenticazione basata su ruoli**

### Best Practices
- Cambia la password admin predefinita
- Configura HTTPS in produzione
- Implementa rate limiting
- Monitora i log di accesso

## 🐛 Risoluzione Problemi

### Problemi Comuni

1. **Server non si avvia**
   - Verifica che Node.js sia installato correttamente
   - Controlla che la porta 3000 sia libera
   - Verifica le dipendenze con `npm install`

2. **Errore database**
   - Controlla i permessi della cartella backend
   - Verifica che SQLite sia supportato
   - Ricrea il database se necessario

3. **Problemi di connessione frontend**
   - Verifica che il server sia in esecuzione
   - Controlla la console del browser per errori CORS
   - Verifica l'URL del server nelle chiamate API

## 📈 Roadmap

### Funzionalità Future
- [ ] **Notifiche push** in tempo reale
- [ ] **App mobile** nativa
- [ ] **Integrazione calendario** aziendale
- [ ] **Sistema di badge** per accesso fisico
- [ ] **Report avanzati** con export Excel/PDF
- [ ] **Integrazione payroll** e stipendi
- [ ] **Sistema di turni** avanzato
- [ ] **Dashboard analytics** avanzate

## 🤝 Contributi

### Come Contribuire
1. Fork il progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 📞 Supporto

Per supporto e domande:
- **Email**: supporto@sistemapresenze.com
- **Documentazione**: Vedi la cartella `Doc/`
- **Issues**: Usa la sezione Issues di GitHub

---

**Sistema Gestione Presenze Dipendenti** - Versione 1.0.0 