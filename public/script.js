document.getElementById("exploreBtn")
?.addEventListener("click", () => {

    document.getElementById("jobs")
    .scrollIntoView({
        behavior: "smooth"
    });
});

document.getElementById("applyBtn")
?.addEventListener("click", () => {

    document.getElementById("applySection")
    .scrollIntoView({
        behavior: "smooth"
    });
});

document.querySelectorAll(".jobBtn")
.forEach(button => {

    button.addEventListener("click", () => {

        window.location.href =
        button.dataset.link;
    });
});

const form =
document.getElementById(
    "applicationForm"
);

if (form) {

    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                document.getElementById("name").value;

            const email =
                document.getElementById("email").value;

            const cv =
                document.getElementById("cv").files[0];

            const job =
                document.querySelector("h1").innerText;

            const formData =
                new FormData();

            formData.append("name", name);

            formData.append("email", email);

            formData.append("cv", cv);

            formData.append("job", job);

            try {

                const response =
                    await fetch("/apply", {

                        method: "POST",

                        body: formData
                    });

                const result =
                    await response.text();

                alert(result);

            } catch (error) {

                console.log(error);

                alert("Application failed");
            }
        }
    );
}