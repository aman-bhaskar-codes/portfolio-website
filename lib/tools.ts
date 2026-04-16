export const tools: any[] = [
    {
        type: "function",
        function: {
            name: "open_github",
            description: "Open a GitHub repository link in a new tab",
            parameters: {
                type: "object",
                properties: {
                    repo: { type: "string", description: "The name of the repository (e.g. 'portfolio-ai')" }
                },
                required: ["repo"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "navigate_section",
            description: "Smoothly scroll to a specific section of the portfolio website",
            parameters: {
                type: "object",
                properties: {
                    section: { type: "string", description: "The ID of the section to scroll to (e.g. 'projects', 'about', 'contact')" }
                },
                required: ["section"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "show_project",
            description: "Open a detailed view or overlay for a specific project",
            parameters: {
                type: "object",
                properties: {
                    projectName: { type: "string", description: "The name of the project to display" }
                },
                required: ["projectName"]
            }
        }
    }
];
