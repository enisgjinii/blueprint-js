// Shadcn-inspired UI replacement for QuickSettings
export class BootstrapUI {
    constructor(containerId, title) {
        this.container = document.getElementById(containerId);
        this.title = title;
        this.controls = {};
        this.callbacks = {};
        this.hidden = false;

        this.addStyles();
        this.createPanel();
    }

    addStyles() {
        if (!document.getElementById('shadcn-styles')) {
            const style = document.createElement('style');
            style.id = 'shadcn-styles';
            style.textContent = `
                .panel-section {
                    margin-bottom: 24px;
                }
                
                .panel-header {
                    margin-bottom: 16px;
                }
                
                .panel-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #09090b;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                
                .panel-body {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .form-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: #374151;
                    margin: 0;
                }
                
                .btn-primary {
                    background-color: #09090b;
                    border: 1px solid #09090b;
                    color: #ffffff;
                    font-size: 13px;
                    font-weight: 500;
                    padding: 8px 16px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    width: 100%;
                }
                
                .btn-primary:hover {
                    background-color: #18181b;
                    border-color: #18181b;
                }
                
                .btn-secondary {
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    color: #09090b;
                    font-size: 13px;
                    font-weight: 500;
                    padding: 8px 16px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    width: 100%;
                }
                
                .btn-secondary:hover {
                    background-color: #f4f4f5;
                }
                
                .form-select, .form-control {
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    color: #09090b;
                    font-size: 13px;
                    padding: 8px 12px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    width: 100%;
                }
                
                .form-select:focus, .form-control:focus {
                    outline: none;
                    border-color: #09090b;
                    box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.1);
                }
                
                .form-range {
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                    cursor: pointer;
                    width: 100%;
                }
                
                .form-range::-webkit-slider-track {
                    background: #e4e4e7;
                    height: 4px;
                    border-radius: 2px;
                }
                
                .form-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    background: #09090b;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    cursor: pointer;
                }
                
                .form-range::-moz-range-track {
                    background: #e4e4e7;
                    height: 4px;
                    border-radius: 2px;
                    border: none;
                }
                
                .form-range::-moz-range-thumb {
                    background: #09090b;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }
                
                .form-check {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .form-check-input {
                    width: 16px;
                    height: 16px;
                    margin: 0;
                    border: 1px solid #e4e4e7;
                    border-radius: 3px;
                }
                
                .form-check-input:checked {
                    background-color: #09090b;
                    border-color: #09090b;
                }
                
                .form-check-label {
                    font-size: 13px;
                    color: #374151;
                    margin: 0;
                    cursor: pointer;
                }
                
                .form-control-color {
                    width: 100%;
                    height: 36px;
                    border: 1px solid #e4e4e7;
                    border-radius: 6px;
                    cursor: pointer;
                }
                
                .image-preview {
                    max-width: 100%;
                    max-height: 80px;
                    border: 1px solid #e4e4e7;
                    border-radius: 6px;
                    object-fit: cover;
                }
                
                .tips-content {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 12px;
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.4;
                }
                
                .texture-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                    margin-top: 8px;
                }
                
                .texture-item {
                    border: 2px solid #e4e4e7;
                    border-radius: 6px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    aspect-ratio: 1;
                }
                
                .texture-item:hover {
                    border-color: #09090b;
                }
                
                .texture-item.selected {
                    border-color: #09090b;
                    box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.1);
                }
                
                .texture-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .texture-placeholder {
                    width: 100%;
                    height: 100%;
                    background-color: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    color: #64748b;
                    text-align: center;
                }
                
                .mode-buttons {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                }
                
                .mode-btn {
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    color: #09090b;
                    font-size: 12px;
                    font-weight: 500;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .mode-btn:hover {
                    background-color: #f4f4f5;
                }
                
                .mode-btn.active {
                    background-color: #09090b;
                    color: #ffffff;
                    border-color: #09090b;
                }
                
                .tips-content p {
                    margin: 0 0 8px 0;
                }
                
                .tips-content p:last-child {
                    margin-bottom: 0;
                }
                
                .tips-content ul {
                    margin: 4px 0;
                    padding-left: 16px;
                }
                
                .tips-content li {
                    margin-bottom: 2px;
                }
                
                .range-value {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 500;
                }
            `;
            document.head.appendChild(style);
        }
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'panel-section';
        this.panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">${this.title}</h3>
            </div>
            <div class="panel-body">
            </div>
        `;

        this.container.appendChild(this.panel);
        this.body = this.panel.querySelector('.panel-body');
    }

    addButton(label, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';

        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = label;
        btn.onclick = callback;

        wrapper.appendChild(btn);
        this.body.appendChild(wrapper);
        this.controls[label] = btn;
        return this;
    }

    addDropDown(label, options, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <select class="form-select">
                ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
            </select>
        `;

        const select = wrapper.querySelector('select');
        select.onchange = (e) => {
            if (callback) callback({ value: e.target.value, index: e.target.selectedIndex });
        };

        this.body.appendChild(wrapper);
        this.controls[label] = select;
        return this;
    }

    addRange(label, min, max, value, step, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" class="form-range" min="${min}" max="${max}" value="${value}" step="${step}" style="flex: 1;">
                <span class="range-value">${value}</span>
            </div>
        `;

        const range = wrapper.querySelector('input');
        const valueSpan = wrapper.querySelector('.range-value');

        range.oninput = (e) => {
            valueSpan.textContent = e.target.value;
            if (callback) callback(parseFloat(e.target.value));
        };

        this.body.appendChild(wrapper);
        this.controls[label] = range;
        return this;
    }

    addColor(label, defaultColor, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <input type="color" class="form-control-color" value="${defaultColor}">
        `;

        const colorInput = wrapper.querySelector('input');
        colorInput.onchange = (e) => {
            if (callback) callback(e.target.value);
        };

        this.body.appendChild(wrapper);
        this.controls[label] = colorInput;
        return this;
    }

    addHTML(label, html) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <div class="tips-content">${html}</div>
        `;

        this.body.appendChild(wrapper);
        return this;
    }

    addImage(label, src, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <img src="${src}" class="image-preview">
        `;

        this.body.appendChild(wrapper);
        this.controls[label] = wrapper.querySelector('img');
        return this;
    }

    addFileChooser(label, buttonText, accept, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <input type="file" class="form-control" accept="${accept}">
        `;

        const fileInput = wrapper.querySelector('input');
        fileInput.onchange = (e) => {
            if (e.target.files.length > 0 && callback) {
                callback(e.target.files[0]);
            }
        };

        this.body.appendChild(wrapper);
        this.controls[label] = fileInput;
        return this;
    }

    addBoolean(label, defaultValue, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" ${defaultValue ? 'checked' : ''}>
                <label class="form-check-label">${label}</label>
            </div>
        `;

        const checkbox = wrapper.querySelector('input');
        checkbox.onchange = (e) => {
            if (callback) callback(e.target.checked);
        };

        this.body.appendChild(wrapper);
        this.controls[label] = checkbox;
        return this;
    }

    addText(label, defaultValue, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <input type="text" class="form-control" value="${defaultValue || ''}">
        `;

        const textInput = wrapper.querySelector('input');
        textInput.onchange = (e) => {
            if (callback) callback(e.target.value);
        };

        this.body.appendChild(wrapper);
        this.controls[label] = textInput;
        return this;
    }

    addNumber(label, min, max, value, step, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <input type="number" class="form-control" min="${min}" max="${max}" value="${value}" step="${step}">
        `;

        const numberInput = wrapper.querySelector('input');
        numberInput.onchange = (e) => {
            if (callback) callback(parseFloat(e.target.value));
        };

        this.body.appendChild(wrapper);
        this.controls[label] = numberInput;
        return this;
    }

    // Binding methods for compatibility with existing code
    bindBoolean(property, target, context) {
        return this.addBoolean(property, target[property], (value) => {
            if (context && context[property]) {
                context[property](value);
            } else {
                target[property] = value;
            }
        });
    }

    bindRange(property, min, max, target, step, context) {
        return this.addRange(property, min, max, target[property], step, (value) => {
            if (context && context[property]) {
                context[property](value);
            } else {
                target[property] = value;
            }
        });
    }

    bindNumber(property, min, max, target, step, context) {
        return this.addNumber(property, min, max, target[property], step, (value) => {
            if (context && context[property]) {
                context[property](value);
            } else {
                target[property] = value;
            }
        });
    }

    bindText(property, target, context) {
        return this.addText(property, target[property], (value) => {
            if (context && context[property]) {
                context[property](value);
            } else {
                target[property] = value;
            }
        });
    }

    bindDropDown(property, options, context) {
        return this.addDropDown(property, options, (data) => {
            if (context && context[property]) {
                context[property](data.value);
            }
        });
    }

    // Utility methods
    getValue(controlName) {
        const control = this.controls[controlName];
        if (!control) return null;

        if (control.type === 'checkbox') return control.checked;
        if (control.type === 'range' || control.type === 'number') return parseFloat(control.value);
        if (control.tagName === 'SELECT') return { value: control.value, index: control.selectedIndex };
        return control.value;
    }

    setValue(controlName, value) {
        const control = this.controls[controlName];
        if (!control) return;

        if (control.type === 'checkbox') {
            control.checked = value;
        } else if (control.tagName === 'IMG') {
            control.src = value;
        } else if (control.tagName === 'SELECT') {
            control.value = value;
        } else {
            control.value = value;
            // Update range value display
            if (control.type === 'range') {
                const valueSpan = control.parentElement.querySelector('.range-value');
                if (valueSpan) valueSpan.textContent = value;
            }
        }
    }

    show() {
        this.panel.style.display = 'block';
        this.hidden = false;
    }

    hide() {
        this.panel.style.display = 'none';
        this.hidden = true;
    }

    showControl(controlName) {
        const control = this.controls[controlName];
        if (control) {
            const wrapper = control.closest('.form-group');
            if (wrapper) wrapper.style.display = 'flex';
        }
    }

    hideControl(controlName) {
        const control = this.controls[controlName];
        if (control) {
            const wrapper = control.closest('.form-group');
            if (wrapper) wrapper.style.display = 'none';
        }
    }

    addTextureGrid(label, textures, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <div class="texture-grid"></div>
        `;

        const grid = wrapper.querySelector('.texture-grid');

        Object.entries(textures).forEach(([key, texture], index) => {
            const item = document.createElement('div');
            item.className = 'texture-item';
            item.dataset.textureKey = key;

            if (texture.colormap) {
                item.innerHTML = `<img src="${texture.colormap}" alt="${key}">`;
            } else {
                item.innerHTML = `<div class="texture-placeholder">${key}</div>`;
            }

            item.onclick = () => {
                // Remove selected class from all items
                grid.querySelectorAll('.texture-item').forEach(t => t.classList.remove('selected'));
                // Add selected class to clicked item
                item.classList.add('selected');

                if (callback) callback({ value: key, index, texture });
            };

            grid.appendChild(item);
        });

        this.body.appendChild(wrapper);
        this.controls[label] = grid;
        return this;
    }

    addModeButtons(label, modes, callback) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
            <label class="form-label">${label}</label>
            <div class="mode-buttons"></div>
        `;

        const container = wrapper.querySelector('.mode-buttons');

        modes.forEach((mode, index) => {
            const btn = document.createElement('button');
            btn.className = 'mode-btn';
            btn.textContent = mode.label;
            btn.dataset.mode = mode.value;

            if (index === 0) btn.classList.add('active');

            btn.onclick = () => {
                // Remove active class from all buttons
                container.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');

                if (callback) callback(mode.value);
            };

            container.appendChild(btn);
        });

        this.body.appendChild(wrapper);
        this.controls[label] = container;
        return this;
    }

    destroy() {
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
    }
}

// Factory function to maintain compatibility with QuickSettings API
export function create(x, y, title, parent) {
    const containerId = parent ? parent.id : 'main-controls';
    return new BootstrapUI(containerId, title);
}