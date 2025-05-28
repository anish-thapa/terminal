
        document.addEventListener('DOMContentLoaded', function() {
            const outputContainer = document.getElementById('output-container');
            const terminalBody = document.getElementById('terminal-body');
            const terminalElement = document.querySelector('.terminal');
            const nepaliTimeElement = document.getElementById('nepali-time');
            const weatherInfoElement = document.getElementById('weather-info');
            
            let currentCommandLine;
            let commandHistory = [];
            let historyIndex = 0;

            // --- Time Update Function ---
            function updateNepaliTime() {
                const now = new Date();
                const options = { 
                    timeZone: 'Asia/Kathmandu', 
                    hour12: true, 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    second: '2-digit' 
                };
                nepaliTimeElement.textContent = now.toLocaleString('en-US', options) + " NPT";
            }
            updateNepaliTime(); 
            setInterval(updateNepaliTime, 1000); 

            
            async function fetchWeather() {
                const kho = 'Itahari';
                const jpt = 'E5ESYMXFX67Q4VXCCBX9P5U5P'; 
                const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${kho}?unitGroup=metric&key=${jpt}&contentType=json`;
                
                weatherInfoElement.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i>fetching`;
                
                try {
                    const response = await fetch(apiUrl);
                    
                    if (!response.ok) {
                        let errorMsg = `API Error (${response.status})`;
                        if (response.status === 401 || response.status === 403) {
                            errorMsg = "Unauthorized or Invalid API Key.";
                        } else if (response.status === 429) {
                            errorMsg = "API rate limit reached.";
                        }
                        weatherInfoElement.innerHTML = `<i class="fas fa-times-circle mr-1"></i>${errorMsg}`;
                        console.error("Error fetching weather:", errorMsg);
                        return;
                    }
                    
                    const data = await response.json();
                    
                    if (!data.currentConditions) {
                        weatherInfoElement.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>Weather data format error.`;
                        console.error("Weather data format error: currentConditions not found in API response:", data);
                        return;
                    }

                    const current = data.currentConditions;
                    const temp = Math.round(current.temp);
                    const description = current.conditions; 
                    const iconCode = current.icon; 
                    
                    let weatherIconClass = 'fas fa-question-circle'; 
                    const iconMapping = {
                        'clear-day': 'fas fa-sun', 'clear-night': 'fas fa-moon',
                        'partly-cloudy-day': 'fas fa-cloud-sun', 'partly-cloudy-night': 'fas fa-cloud-moon',
                        'cloudy': 'fas fa-cloud', 'rain': 'fas fa-cloud-showers-heavy',
                        'showers-day': 'fas fa-cloud-sun-rain', 'showers-night': 'fas fa-cloud-moon-rain',
                        'snow': 'fas fa-snowflake', 'sleet': 'fas fa-cloud-meatball', 
                        'wind': 'fas fa-wind', 'fog': 'fas fa-smog',
                        'thunderstorm': 'fas fa-bolt', 'thunder-rain': 'fas fa-cloud-bolt', 
                        'thunder-showers-day': 'fas fa-cloud-bolt', 'thunder-showers-night': 'fas fa-cloud-bolt',
                    };

                    if (iconMapping[iconCode]) {
                        weatherIconClass = iconMapping[iconCode];
                    } else {
                        console.warn("Unmapped weather icon from Visual Crossing:", iconCode);
                    }

                    weatherInfoElement.innerHTML = `<i class="${weatherIconClass} mr-1"></i> ${temp}°C, ${description}`;
                } catch (error) { 
                    weatherInfoElement.innerHTML = `<i class="fas fa-times-circle mr-1"></i>Weather unavailable. Check console.`;
                    console.error("Failed to fetch weather (Network error or critical issue):", error);
                }
            }
            fetchWeather(); 
            setInterval(fetchWeather, 30 * 60 * 1000); 


            const commands = {
                'help': document.getElementById('help-command').innerHTML,
                'about': document.getElementById('about-command').innerHTML,
                'skills': document.getElementById('skills-command').innerHTML,
                'projects': document.getElementById('projects-command').innerHTML,
                'education': document.getElementById('education-command').innerHTML,
                'contact': document.getElementById('contact-command').innerHTML,
                'repo': document.getElementById('repo-command').innerHTML, 
                'clear': '' 
            };

            function createNewInputLine() {
                const inputLineContainer = document.createElement('div');
                inputLineContainer.className = 'flex items-start mb-2 command-input-line';
                inputLineContainer.innerHTML = `
                    <span class="prompt mr-2">$</span>
                    <span class="command-input flex-1" contenteditable="true" spellcheck="false"></span>
                    <span class="blinking-cursor">|</span>
                `;
                outputContainer.appendChild(inputLineContainer);
                
                currentCommandLine = inputLineContainer.querySelector('.command-input');
                currentCommandLine.focus();
                
                currentCommandLine.addEventListener('keydown', handleInputKeydown);
                currentCommandLine.addEventListener('keydown', handleTabCompletion);
                
                terminalBody.scrollTop = terminalBody.scrollHeight;
            }

            function placeCursorAtEnd(el) {
                el.focus();
                if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else if (typeof document.body.createTextRange != "undefined") { 
                    const textRange = document.body.createTextRange();
                    textRange.moveToElementText(el);
                    textRange.collapse(false);
                    textRange.select();
                }
            }


            function handleInputKeydown(e) {
                const cmdText = this.textContent.trim();

                if (e.key === 'Enter') {
                    e.preventDefault();
                    
                    this.setAttribute('contenteditable', 'false');
                    this.classList.remove('command-input');
                    this.classList.add('command'); 
                    
                    const cursorSpan = this.nextElementSibling;
                    if (cursorSpan && cursorSpan.classList.contains('blinking-cursor')) {
                        cursorSpan.style.display = 'none'; 
                    }

                    processCommand(cmdText, this.parentElement);
                    
                    if (cmdText && (commandHistory.length === 0 || cmdText !== commandHistory[commandHistory.length - 1])) {
                        if (cmdText.toLowerCase() !== 'clear'){ 
                           commandHistory.push(cmdText);
                        }
                    }
                    historyIndex = commandHistory.length; 

                    if (cmdText.toLowerCase() !== 'clear') {
                        createNewInputLine();
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (commandHistory.length > 0 && historyIndex > 0) {
                        historyIndex--;
                        this.textContent = commandHistory[historyIndex];
                        placeCursorAtEnd(this);
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (historyIndex < commandHistory.length - 1) {
                        historyIndex++;
                        this.textContent = commandHistory[historyIndex];
                        placeCursorAtEnd(this);
                    } else if (historyIndex === commandHistory.length - 1) {
                        historyIndex++;
                        this.textContent = ''; 
                        placeCursorAtEnd(this);
                    }
                }
            }

            function handleTabCompletion(e) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const currentText = this.textContent.trim().toLowerCase();
                    if (!currentText) return;

                    const matchingCommand = Object.keys(commands).find(cmdKey => 
                        cmdKey.startsWith(currentText) && cmdKey !== 'repo' 
                    );
                    
                    if (matchingCommand) {
                        this.textContent = matchingCommand;
                        placeCursorAtEnd(this);
                    }
                }
            }
            
            function processCommand(cmd, commandLineElement) {
                const cmdLower = cmd.toLowerCase();
                let responseHTML = '';

                if (cmdLower === 'clear') {
                    outputContainer.innerHTML = ''; 
                    createNewInputLine(); 
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                    return;
                }
                
                if (cmdLower === 'repo') { 
                    responseHTML = commands[cmdLower];
                    window.open('https://github.com/anish-thapa/terminal-portfolio', '_blank'); 
                } else if (commands[cmdLower]) {
                    responseHTML = commands[cmdLower];
                } else if (cmd) { 
                    const errorTemplate = document.getElementById('error-command').innerHTML;
                    responseHTML = errorTemplate.replace('<span id="error-cmd-name"></span>', `<span class="command">${cmd}</span>`);
                } else { 
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                    return; 
                }
                
                const responseDisplay = document.createElement('div');
                responseDisplay.innerHTML = responseHTML;
                responseDisplay.classList.add('animate-fadeInUp'); 
                
                if (commandLineElement && commandLineElement.parentElement) {
                     commandLineElement.insertAdjacentElement('afterend', responseDisplay);
                } else {
                    outputContainer.appendChild(responseDisplay);
                }
                terminalBody.scrollTop = terminalBody.scrollHeight;
            }
            
            terminalElement.addEventListener('click', (event) => {
                if (event.target.tagName !== 'A' && currentCommandLine && !currentCommandLine.contains(event.target)) {
                    currentCommandLine.focus();
                    placeCursorAtEnd(currentCommandLine);
                }
            });
            
            createNewInputLine();
        });
