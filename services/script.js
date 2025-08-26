document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.service button');
    
    
    const userId = 1;

    buttons.forEach(button => {
        button.addEventListener('click', async () => {
           
            const serviceElement = button.closest('.service');
            const category = serviceElement.id;

            try {
                
                const response = await fetch('http://localhost:3000/requests');
                const requests = await response.json();
                const maxId = requests.length > 0 ? Math.max(...requests.map(req => req.id)) : 0;
                const newId = maxId + 1;

                const requestData = {
                    id: newId,
                    userId: userId,
                    category: category
                };
                const postResponse = await fetch('http://localhost:3000/requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (postResponse.ok) {
                    alert('Ваша заявка принята');
                } else {
                    alert('Ошибка при отправке заявки');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при отправке заявки');
            }
        });
    });
});