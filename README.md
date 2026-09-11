# Galitube Tickets — Galitube Hosting

Discord-Ticketbot mit eigener Web-Oberfläche, Arbeitszeiten und bearbeitbaren Panels.

Repository: https://github.com/Galitube-Developement/GalitubeTickets

## Installation (Node.js / Windows / Linux)

Voraussetzungen: Node.js 22.13 oder neuer und Git. Verwende npm; beide package-lock.json-Dateien gehören ins Repository.

```sh
git clone https://github.com/Galitube-Developement/GalitubeTickets.git
cd GalitubeTickets
npm ci
```

`npm ci` erstellt beim ersten Mal `.env`, installiert und baut die Web-Oberfläche. Ohne gesetzten Datenbankanbieter wird die Datenbankvorbereitung zunächst übersprungen.

1. Lege im Discord Developer Portal eine Application mit Bot an. Aktiviere **Server Members Intent**, **Message Content Intent** und für die Anwesenheitsprüfung **Presence Intent**.
2. Trage in `.env` den Bot-Token als `DISCORD_TOKEN` und das OAuth2 Client Secret als `DISCORD_SECRET` ein. Bewahre den erzeugten `ENCRYPTION_KEY` dauerhaft auf; bestehende verschlüsselte Daten benötigen genau diesen Schlüssel.
3. Setze `DB_PROVIDER=sqlite` für eine lokale Datenbank in `user/database.db`. Für MySQL oder PostgreSQL verwende `DB_PROVIDER=mysql` bzw. `postgresql` und die passende `DB_CONNECTION_URL`.
4. Setze `HTTP_EXTERNAL=http://localhost:8169` für einen lokalen Test. Für eine Domain verwende deren vollständige HTTPS-Adresse ohne abschließenden Slash. Hinterlege im Developer Portal als OAuth2 Redirect URI exakt `<HTTP_EXTERNAL>/auth/callback`.
5. Setze `HTTP_HOST=127.0.0.1` für ausschließlich lokale Nutzung. Für LAN/Container: `HTTP_HOST=0.0.0.0`, `HTTP_EXTERNAL=http://<Server-LAN-IP>:8169`; erlaube Port 8169 in der Firewall nur für die gewünschten Netze. Öffentlich HTTPS über einen Reverse Proxy verwenden; `HTTP_TRUST_PROXY=true` nur hinter einem vertrauenswürdigen Proxy.
6. `SUPER` bleibt standardmäßig leer. Falls benötigt: deine eigene Discord-Benutzer-ID eintragen. Diese Einstellung gewährt globale Verwaltungsrechte.
7. Bereite die Datenbank vor und starte den Bot:

```sh
npm run postinstall
npm start
```

Öffne die konfigurierte Adresse im Browser, melde dich mit Discord an und verwalte deinen Server. Über `/invite` kannst du den Bot zum Server hinzufügen. Die Web-Oberfläche liegt als bearbeitbarer Quellcode in `web/` vor.

## Work Hours

Unter **General settings → Working hours** die IANA-Zeitzone (z. B. `Europe/Zurich`) und die Zeiten für Sonntag bis Samstag einstellen und speichern.

- Gleiche Start-/Endzeit: geschlossen (`00:00–00:00`).
- `00:00–23:59`: ganztägig geöffnet, einschließlich der letzten Minute.
- `22:00–06:00`: Schicht bis 06:00 am nächsten Tag.
- Außerhalb der Zeiten zeigt ein neues Ticket den nächsten Beginn mit Discord-Zeitstempel an. Bei sieben geschlossenen Tagen erscheint ein Hinweis ohne erfundenen Termin.
- Tickets bleiben auch außerhalb der Arbeitszeiten möglich. Work Hours informieren über die Verfügbarkeit des Teams.

Die Prüfung verändert keine gecachten Einstellungen. Wochenwechsel, Sonntag und Sommer-/Winterzeit werden berücksichtigt. Alte leere Tageswerte werden als geschlossen behandelt.

## Panels bearbeiten

Unter **Panels** einen Kanal auswählen. Die Oberfläche liest bestehende Panel-Nachrichten direkt aus Discord, auch solche, die vor diesem Update erstellt wurden. Mit **Search older messages** werden weitere Nachrichten geladen. Alternativ einen Discord-Nachrichtenlink einfügen und **Load panel** klicken.

**Edit** lädt Titel, Beschreibung, Bilder und Kategorien ins Formular. **Save changes** aktualisiert dieselbe Discord-Nachricht; ihre ID und der Link bleiben gleich. Ein leeres Bildfeld entfernt das Bild. **Create a new panel** startet ein neues Formular. Der Kanal eines bestehenden Panels bleibt fest, da Nachrichten nicht zwischen Kanälen verschoben werden können.

Unterstützt werden Button- und Auswahlmenü-Panels dieses Bots. Der Bot benötigt Zugriff auf den Kanal und dessen Nachrichtenverlauf. Es werden nur Panels des ausgewählten Servers bearbeitet. Reine alte Textnachrichten ohne Ticket-Komponenten können nicht eindeutig als Panel erkannt werden.

## Automatische Updates

Bei `npm start` und `node .` wird **vor Discord-Login** der `main`-Branch von **Galitube-Developement/GalitubeTickets** geprüft. Neue Commits werden per Fast-Forward übernommen; Versionsnummern oder GitHub Releases sind dafür nicht erforderlich. Das unveränderliche Docker-Image führt dagegen genau den beim Image-Build enthaltenen Quellstand aus; für Updates wird ein neues Image gepullt und der Container neu erstellt.

Danach installiert der Bot die gesperrten Abhängigkeiten, baut die Web-Oberfläche, generiert den Prisma-Client und führt Datenbankmigrationen aus. Erst nach Erfolg startet ein frischer Prozess mit dem aktualisierten Code. Die bisherigen wöchentlichen Update-Prüfungen bleiben bestehen und weisen auf einen nötigen Neustart hin.

- Voraussetzung: Git-Checkout auf `main`, Netzwerkzugriff und Schreibrechte für den Bot-Benutzer.
- Lokale Änderungen, unversionierte Dateien und abweichende Branches werden nicht überschrieben. Der Log nennt den Grund, wenn ein Update übersprungen wird.
- `.env`, `user/` und `logs/` sind vom Git-Update ausgeschlossen. Datenbanken vor Updates regulär sichern, besonders bei externem MySQL/PostgreSQL.
- Bei Netzwerkfehlern läuft die vorhandene Version weiter. Bei fehlgeschlagener Installation nach einer Code-Aktualisierung stoppt der Start; beim nächsten Start wird die Installation erneut versucht. Es wird keine bereits migrierte Datenbank automatisch zurückgesetzt.
- Die vorherige Codeversion ist unter `refs/galitube/pre-update` referenziert. Manuelle Wiederherstellung immer zusammen mit dem passenden Datenbankstand planen.
- `AUTO_UPDATE=false` in `.env` deaktiviert neue automatische Installationen. Eine bereits begonnene, fehlgeschlagene Installation muss trotzdem abgeschlossen werden.
- ZIP-Downloads haben keine Git-Historie und können nicht automatisch aktualisiert werden. Für diese Funktion per Git installieren.

Neue Änderungen müssen zunächst in diesem Repository auf `main` veröffentlicht sein. Die lokale Arbeitskopie allein ist noch kein verfügbares Update.

## Docker / Pterodactyl / Pelican

Jedes Image enthält den Quellstand dieses Repositories unter `/app`; es wird beim Start kein Upstream-Repository geklont oder kopiert. `/home/container/user` enthält persistente Benutzerdaten (bei SQLite auch `database.db`), `/home/container/logs` die persistente Protokollausgabe. Das Startskript bereitet zuerst die Umgebung vor, wählt das Prisma-Schema für MySQL, PostgreSQL oder SQLite, führt `prisma generate` und `prisma migrate deploy` aus und startet anschließend den Bot.

Lokal bauen:

```sh
docker build -t galitubetickets .
```

Das veröffentlichte Image ist `ghcr.io/galitube-developement/galitubetickets:latest`. `latest` kennzeichnet eine stabile Release-Version, `main` den aktuellen Stand des Standard-Branches. Ein Release wie `v4.1.0` erhält zusätzlich die Tags `4.1.0`, `4.1` und `4`; CI erzeugt außerdem einen unveränderlichen Kurz-Commit-Tag wie `sha-abcdef1`.

Für eine neue lokale Compose-Installation zuerst `.env` wie oben anlegen. Mindestens erforderlich sind `DISCORD_TOKEN`, `DISCORD_SECRET`, ein dauerhaft gesicherter `ENCRYPTION_KEY`, `DB_PROVIDER` und bei MySQL/PostgreSQL `DB_CONNECTION_URL`. Mit der mitgelieferten Compose-Konfiguration wird MySQL verwendet; zusätzlich müssen `MYSQL_PASSWORD` und `MYSQL_ROOT_PASSWORD` in `.env` gesetzt sein:

```sh
docker compose up -d --build
docker compose logs -f bot
```

Für Pterodactyl und Pelican die jeweilige Egg-Datei aus `eggs/` importieren und **GalitubeTickets Latest** oder **GalitubeTickets Main** auswählen. Beide starten `/app/scripts/start.sh` mit `PTERODACTYL=true`; Datenbank- und übrige Umgebungsvariablen bleiben konfigurierbar. `SUPER` ist absichtlich leer: nur bei bewusst benötigten globalen Rechten eigene Discord-IDs eintragen.

## Entwicklung und Prüfung

```sh
npm run test:unit
npm test
npm run build:web
```

Für eine Web-Änderung ohne erneute Installation: `npm --prefix web run build`. `SKIP_WEB_BUILD=true` überspringt den Web-Build bei `postinstall`, wenn bereits ein passender Build vorhanden ist.

## Herkunft und Lizenz

Dieses Projekt basiert auf Discord Tickets und dessen Settings-Oberfläche von Isaac Saunders / eartharoid. Siehe [NOTICE.md](NOTICE.md), [LICENSE](LICENSE), [web/LICENSE](web/LICENSE) und [CONTRIBUTORS.md](CONTRIBUTORS.md). Originale Copyright-Hinweise bleiben erhalten. Das Produktbranding lautet Galitube Tickets / Galitube Hosting.
