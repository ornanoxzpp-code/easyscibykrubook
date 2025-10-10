Document.addEventListener('DOMContentLoaded', () => {
    
    // *** ✅ CONFIG: URL ของ Apps Script ที่คุณ Deploy มาจาก Google Sheet ม.1 (อันล่าสุด) ✅ ***
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBux71ffOo12kaltqcuycPdpo5qBupLmfTv9dvClot6m80RTETRV_fEZ-aRrvfRMSeJQ/exec'; 
    
    // ------------------------------------------------------------------
    // เลือกองค์ประกอบที่ใช้ในการทำงาน
    // ------------------------------------------------------------------
    const seats = document.querySelectorAll('.seat'); 
    const modal = document.getElementById('booking-modal');
    const closeButton = document.querySelector('.close-button');
    const bookingForm = document.getElementById('booking-form');
    const transferDetails = document.getElementById('transfer-details');
    const bookingFormArea = document.getElementById('booking-form-area');
    const nextToFormButton = document.getElementById('next-to-form');
    const backToDetailsButton = document.getElementById('back-to-details');
    const currentDeskInfoStep1 = document.getElementById('current-desk-info-step1');
    const currentDeskInfoStep2 = document.getElementById('current-desk-info-step2');
    
    let selectedSeat = null; 
    let submittedName = ''; // ตัวแปรสำหรับเก็บชื่อที่เพิ่งจอง
    
    
    // ------------------------------------------------------------------
    // 1. ฟังก์ชันดึงสถานะจาก Google Sheet (Real-time update)
    // ------------------------------------------------------------------
    const fetchSeatStatus = async () => {
        try {
            // ดึงข้อมูลสถานะที่นั่งทั้งหมด (ใช้ JSONP)
            const response = await fetch(`${APPS_SCRIPT_URL}?callback=handleResponse`);
            const text = await response.text();

            // แยกข้อมูล JSON ออกมา (ตัด callback function name ออก)
            const jsonString = text.substring(text.indexOf('(') + 1, text.lastIndexOf(')'));
            const data = JSON.parse(jsonString);

            // อัปเดตสถานะของที่นั่งบนหน้าเว็บ
            data.forEach(seatData => {
                const seatElement = document.querySelector(`.seat[data-seat-id="${seatData['Seat ID']}"]`);
                if (seatElement) {
                    seatElement.setAttribute('data-status', seatData['Status']);
                    if (seatData['Status'] === 'Booked') {
                        // บันทึกชื่อผู้จองจาก Google Sheet
                        seatElement.setAttribute('data-name', seatData['Name']);
                    } else {
                         // ล้างชื่อผู้จองถ้าสถานะไม่ใช่ Booked
                        seatElement.removeAttribute('data-name'); 
                    }
                }
            });

        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงสถานะ:', error);
        }
    };
    fetchSeatStatus();
    
    window.handleResponse = function(data) {}; // Dummy function for JSONP


    // ------------------------------------------------------------------
    // 2. ฟังก์ชันจัดการหลังส่งฟอร์ม (POST)
    // ------------------------------------------------------------------
    window.handleSuccessfulSubmission = function(response) {
        if (response.status === 'success') {
            alert(`🎉 การจองสำเร็จแล้ว!`);
            alert(`รบกวนส่งหลักฐานการชำระเงินมาที่ไลน์ส่วนตัวของคุณครู เพื่อยืนยันการจอง`);
            
            // ✅ โค้ดที่แก้ไข: อัปเดตสถานะใน DOM ทันที (แก้ปัญหาไม่ขึ้นสีแดง)
            if (selectedSeat) {
                selectedSeat.setAttribute('data-status', 'Booked'); 
                selectedSeat.setAttribute('data-name', submittedName); // บันทึกชื่อที่เพิ่งจอง
            }

            closeModal();
            // เรียก fetchSeatStatus ซ้ำ เพื่อยืนยันสถานะจากชีตอีกครั้ง
            fetchSeatStatus(); 
            
        } else if (response.status === 'error' && response.message.includes('ที่นั่งถูกจองแล้ว')) {
            // แจ้งเตือนเมื่อมีการจองซ้ำซ้อนโดยคนอื่น
            alert('❌ ที่นั่งนี้เพิ่งถูกจองโดยผู้อื่น กรุณาเลือกที่นั่งใหม่');
            closeModal();
            fetchSeatStatus(); // โหลดสถานะใหม่
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึกการจอง กรุณาลองใหม่อีกครั้ง');
            console.error(response.message);
            closeModal();
        }
    };

    // ------------------------------------------------------------------
    // 3. Logic การจอง
    // ------------------------------------------------------------------
    const closeModal = () => {
        modal.style.display = 'none';
        bookingForm.reset(); 
        selectedSeat = null;
        // รีเซ็ตหน้าต่าง Modal ให้กลับไปหน้า 'transferDetails' เสมอ
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block'; 
        submittedName = ''; // ล้างชื่อผู้จอง
    };

    seats.forEach(seat => {
        seat.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            // ตรวจสอบและบล็อกการจองตั้งแต่การคลิก
            if (seat.getAttribute('data-status') === 'Booked') {
                
                // *** ✅ โค้ดที่แก้ไข: แสดงชื่อผู้จอง ✅ ***
                const name = seat.getAttribute('data-name');
                const seatId = seat.getAttribute('data-seat-id');

                let alertMessage = `❌ ที่นั่ง ${seatId} ถูกจองแล้ว`;

                if (name) {
                    alertMessage += `\n\nผู้จอง: ${name}`;
                } else {
                    alertMessage += `โดยผู้อื่น`;
                }
                
                alertMessage += `\n\nกรุณาเลือกที่นั่งอื่น`;
                
                alert(alertMessage);
                // **********************************
                
                return; // หยุดการทำงานของโค้ด ไม่ให้เปิด Modal
            }
            
            try {
                selectedSeat = seat;
                const seatId = selectedSeat.getAttribute('data-seat-id'); 
                // โค้ดส่วนนี้อาจต้องดูโครงสร้าง HTML ถ้าไม่มี class .desk
                const deskElement = selectedSeat.closest('.desk'); 
                const deskId = deskElement ? deskElement.getAttribute('data-desk-id') : 'N/A'; 

                const deskInfo = `โต๊ะที่ ${deskId} ตำแหน่ง ${seatId}`;
                currentDeskInfoStep1.textContent = deskInfo;
                currentDeskInfoStep2.textContent = deskInfo;
                
                modal.style.display = 'block';

            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการเปิดฟอร์ม:", error);
            }
        });
    });

    nextToFormButton.addEventListener('click', () => {
        // ตรวจสอบความถูกต้องของข้อมูลในฟอร์มก่อนไปหน้าต่อไป
        if (!bookingForm.checkValidity()) {
            // ถ้าข้อมูลไม่ครบหรือผิดพลาด ให้แจ้งเตือน
            bookingForm.reportValidity();
            return;
        }
        
        transferDetails.style.display = 'none';
        bookingFormArea.style.display = 'block';
    });
    
    backToDetailsButton.addEventListener('click', () => {
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block';
    });

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // ------------------------------------------------------------------
    // 4. การส่งฟอร์ม (Fetch API)
    // ------------------------------------------------------------------
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        if (!selectedSeat) return;

        const seatId = selectedSeat.getAttribute('data-seat-id');
        const deskElement = selectedSeat.closest('.desk'); 
        const deskId = deskElement ? deskElement.getAttribute('data-desk-id') : 'N/A';
        
        const formData = new FormData(bookingForm);
        formData.append('deskId', deskId);
        formData.append('seatId', seatId);
        
        submittedName = document.getElementById('name').value; // ✅ เก็บชื่อที่ส่ง
        formData.append('name', submittedName);

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: formData, 
            });

            const result = await response.json();
            window.handleSuccessfulSubmission(result); 

        } catch (error) {
            console.error("Error submitting form:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
            closeModal();
        }
    });
});
