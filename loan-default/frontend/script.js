// On Load, render history
renderHistory();

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const icon = document.getElementById('themeIcon');
    if (document.body.classList.contains('light-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

function toggleHistory() {
    document.getElementById('historyPanel').classList.toggle('open');
}

function generateExplainability(data, prediction) {
    const reasons = [];
    if (data.loan > data.balance * 3) {
        reasons.push("Requested loan amount is significantly higher than current balance.");
    }
    if (data.app_score < 50) {
        reasons.push("Low app engagement indicates potential risk.");
    } else if (data.app_score > 80) {
        reasons.push("High app engagement strongly supports a positive profile.");
    }
    if (data.transactions < 5) {
        reasons.push("Low recent transaction volume.");
    }
    if (data.mobile_usage > 20) {
        reasons.push("High mobile usage is correlated with specific risk patterns.");
    }
    
    if (reasons.length === 0) {
        reasons.push(prediction === 1 ? "Multiple minor risk factors combined." : "Standard profile with healthy financial indicators.");
    }
    return reasons;
}

function saveToHistory(data, result) {
    let history = JSON.parse(localStorage.getItem('loanHistory')) || [];
    history.unshift({
        date: new Date().toLocaleTimeString(),
        loan: data.loan,
        balance: data.balance,
        score: (result.risk_score * 100).toFixed(1),
        prediction: result.prediction
    });
    if (history.length > 5) history.pop();
    localStorage.setItem('loanHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('loanHistory')) || [];
    list.innerHTML = '';
    
    if (history.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No recent predictions.</p>';
        return;
    }

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${item.prediction === 1 ? 'high' : 'low'}`;
        div.innerHTML = `
            <div class="history-item-title">
                <span>$${item.loan} Loan</span>
                <span style="color: ${item.prediction === 1 ? 'var(--danger)' : 'var(--success)'}">${item.score}% Risk</span>
            </div>
            <div class="history-item-details">
                Bal: $${item.balance} &nbsp;&bull;&nbsp; ${item.date}
            </div>
        `;
        list.appendChild(div);
    });
}

function clearHistory() {
    localStorage.removeItem('loanHistory');
    renderHistory();
}

async function predict() {
    const btn = document.getElementById("predictBtn");
    const btnText = document.getElementById("btnText");
    const resultDiv = document.getElementById("result");
    const resultMessage = document.getElementById("resultMessage");
    const gaugeFill = document.getElementById("gaugeFill");
    const gaugeText = document.getElementById("gaugeText");
    const explainabilityBox = document.getElementById("explainabilityBox");
    const reasonsList = document.getElementById("reasonsList");

    // Start loading state
    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Analyzing Risk...';
    resultDiv.classList.remove('show', 'high-risk', 'low-risk');
    explainabilityBox.style.display = 'none';
    
    // Reset gauge visually before fetching
    gaugeFill.style.strokeDashoffset = 125.6; 
    gaugeText.innerText = "0%";
    
    try {
        const data = {
            mobile_usage: parseFloat(document.getElementById("mobile").value) || 0,
            calls: parseFloat(document.getElementById("calls").value) || 0,
            sms: parseFloat(document.getElementById("sms").value) || 0,
            app_score: parseFloat(document.getElementById("app").value) || 0,
            transactions: parseFloat(document.getElementById("transactions").value) || 0,
            balance: parseFloat(document.getElementById("balance").value) || 0,
            loan: parseFloat(document.getElementById("loan").value) || 0
        };

        const response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // Show the div first so gauge can animate from 0
        resultDiv.className = 'show';

        setTimeout(() => {
            const riskPercentage = (result.risk_score * 100).toFixed(1);
            
            // Animate Gauge
            const offset = 125.6 - (125.6 * (riskPercentage / 100));
            gaugeFill.style.strokeDashoffset = offset;
            gaugeText.innerText = `${riskPercentage}%`;

            if (result.prediction === 1) {
                gaugeFill.style.stroke = "var(--danger)";
                resultMessage.innerHTML = `<br>⚠️ <strong style="color: var(--danger)">High Risk Profile</strong><br>We recommend rejecting this loan.`;
                resultDiv.classList.add('high-risk');
            } else {
                gaugeFill.style.stroke = "var(--success)";
                resultMessage.innerHTML = `<br>✅ <strong style="color: var(--success)">Low Risk Profile</strong><br>This loan is safe to approve.`;
                resultDiv.classList.add('low-risk');
                
                // Fire Confetti!
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#10b981', '#3b82f6', '#8b5cf6']
                });
            }

            // Show Explainability
            const reasons = generateExplainability(data, result.prediction);
            reasonsList.innerHTML = reasons.map(r => `<li>${r}</li>`).join('');
            explainabilityBox.style.display = 'block';

            // Save to history
            saveToHistory(data, result);
            
            // Reset button
            btn.disabled = false;
            btnText.innerText = 'Analyze Risk Profile';
        }, 100); 

    } catch (error) {
        resultDiv.className = 'high-risk show';
        resultMessage.innerHTML = `❌ <strong>Error connecting to server</strong><br>Ensure the Python backend is running.`;
        btn.disabled = false;
        btnText.innerText = 'Analyze Risk Profile';
    }
}