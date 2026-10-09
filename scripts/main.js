Hooks.once('init', function() {
    console.log("===========================================");
    console.log("Role Sync | Inicializando plugin backend...");
    console.log("===========================================");
});

Hooks.once('ready', async function() {
    console.log("Role Sync | Inicializando conexión con Salas...");

    if (game.user.isGM) {
        try {
            const { default: io } = await import("https://cdn.socket.io/4.7.4/socket.io.esm.min.js");
            
            const socket = io("https://servidor-ws-prueba.onrender.com");
            
            // Nombre de la sala secreta (El QR contendrá esto)
            const miSala = "sala_de_prueba";

            socket.on("connect", () => {
                console.log("[PLUGIN] Conectado al Servidor");
                
                socket.emit("unirse_partida", miSala);
                console.log(`[PLUGIN] Escuchando sala: ${miSala}`);
            });

            socket.on("orden_para_foundry", async (payload) => {
                console.log("[PLUGIN] Orden recibida desde la app:", payload);

                if (payload.accion === "CURAR") {
                    const actor = game.actors.get(payload.actorId);
                    if (actor) {
                        console.log(`[PLUGIN] Curando a ${actor.name}...`);
                        await actor.update({ "system.attributes.hp.value": payload.hp });
                        console.log("[PLUGIN] Vida actualizada correctamente.");
                    }
                }
            });

            Hooks.on("updateActor", (actor, changes, options, userId) => {
                if (changes.system?.attributes?.hp !== undefined) {
                    
                    const nuevaVida = changes.system.attributes.hp.value;
                    console.log(`[PLUGIN] Vida de ${actor.name} ha cambiado a ${nuevaVida}.`);
                    
                    socket.emit("datos_desde_foundry", {
                        sala: miSala,
                        payload: {
                            accion: "ACTUALIZAR_UI",
                            actorId: actor.id,
                            hp: nuevaVida
                        }
                    });
                }
            });

        } catch (error) {
            console.error("[PLUGIN] Error conectando:", error);
        }
    }
});
