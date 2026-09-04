class NexivraLiveAvatar extends HTMLElement {

    connectedCallback() {

        this.innerHTML = `
            <div style="
                width: 100%;
                min-height: 300px;
                background: #111;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                font-size: 24px;
                box-sizing: border-box;
            ">
                NEXIVRA CUSTOM ELEMENT IS WORKING
            </div>
        `;

        console.log(
            "NEXIVRA external custom element loaded."
        );
    }
}

customElements.define(
    "nexivra-live-avatar",
    NexivraLiveAvatar
);
