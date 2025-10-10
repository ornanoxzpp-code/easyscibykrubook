document.addEventListener('DOMContentLoaded', () => {
    
    // *** CONFIG: URL ของ Apps Script ที่คุณ Deploy มาจาก Google Sheet ของ ม.1 ***
    // ⚠️ ต้องเปลี่ยน URL นี้สำหรับ ม.2 และ ม.3
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyLBHynFWQxru3jAdThWbHLCPH9QN2ncx4Thn_T6VFw-4vx3nYDTUwpjD0BK5q5rx6M9A/exec'; 
    
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
    
    
    // ------------------------------------------------------------------
    // 1. ฟังก์ชันดึงสถานะจาก Google Sheet (Apps Script doGet)
    // ------------------------------------------------------------------
    const fetchSeatStatus = async () => {
        try {
            // ดึงข้อมูลสถานะที่นั่งทั้งหมด (ใช้ JSONP)
            const response = await fetch(`${APPS_SCRIPT_URL}?callback=handleResponse`);
            const text = await response.text();

            // แยกข้อมูล JSON ออกมา
            const jsonString = text.substring(text.indexOf('(') + 1, text.lastIndexOf(')'));
            const data = JSON.parse(jsonString);

            // อัปเดตสถานะของที่นั่งบนหน้าเว็บ
            data.forEach(seatData => {
                const seatElement = document.querySelector(`.seat[data-seat-id="${seatData['Seat ID']}"]`);
                if (seatElement) {
                    seatElement.setAttribute('data-status', seatData['Status']);
                    if (seatData['Status'] === 'Booked') {
                        seatElement.setAttribute('data-name', seatData['Name']);
                    }
                }
            });
            console.log('สถานะที่นั่ง ม.1 อัปเดตเรียลไทม์สำเร็จ');

        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงสถานะ ม.1:', error);
            // Alert ถูกลบออกเพื่อให้ระบบดูสะอาดตาขึ้น
        }
    };
    fetchSeatStatus();
    
    window.handleResponse = function(data) {}; // Dummy function for JSONP


    // ------------------------------------------------------------------
    // 2. ฟังก์ชันจัดการเมื่อการส่งข้อมูลสำเร็จ (Apps Script doPost)
    // ------------------------------------------------------------------
    window.handleSuccessfulSubmission = function(response) {
        if (response.status === 'success') {
            alert(`🎉 การจองสำเร็จแล้ว`);
            alert(`รบกวนส่งหลักฐานการชำระเงินมาที่ไลน์ส่วนตัวของคุณครู เพื่อยืนยันการจอง`);
            alert(`บุ๊คขอบคุณค่ะ`);
            
            selectedSeat.setAttribute('data-status', 'Booked');
            selectedSeat.setAttribute('data-name', response.name); 

            closeModal();
            
        } else if (response.status === 'error' && response.message === 'ที่นั่งถูกจองแล้ว') {
            alert('❌ ที่นั่งนี้เพิ่งถูกจองโดยผู้อื่น กรุณาเลือกที่นั่งใหม่');
            closeModal();
            fetchSeatStatus(); 
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึกการจอง กรุณาลองใหม่อีกครั้ง');
            closeModal();
        }
    };

    // ------------------------------------------------------------------
    // 3. ฟังก์ชันและ Event Listeners
    // ------------------------------------------------------------------
    const closeModal = () => {
        modal.style.display = 'none';
        bookingForm.reset(); 
        selectedSeat = null;
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block';
    };

    seats.forEach(seat => {
        seat.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            if (seat.getAttribute('data-status') === 'Booked') {
                alert(`ที่นั่งนี้ถูกจองแล้วโดย ${seat.getAttribute('data-name') || 'ผู้อื่น'}! กรุณาเลือกที่นั่งอื่น`);
                return; 
            }
            
            try {
                selectedSeat = seat;
                const seatId = selectedSeat.getAttribute('data-seat-id'); 
                const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id'); 

                const deskInfo = `โต๊ะที่ ${deskId} ตำแหน่ง ${seatId}`;
                currentDeskInfoStep1.textContent = deskInfo;
                currentDeskInfoStep2.textContent = deskInfo;
                
                modal.style.display = 'block';

            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการเปิดฟอร์ม:", error);
                alert("ไม่สามารถเปิดฟอร์มจองได้");
            }
        });
    });

    nextToFormButton.addEventListener('click', () => {
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
    // 4. การส่งฟอร์ม: ใช้ Fetch API (AJAX) ส่งไป Apps Script
    // ------------------------------------------------------------------
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        if (!selectedSeat) return;

        const seatId = selectedSeat.getAttribute('data-seat-id');
        const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id');
        
        const formData = new FormData(bookingForm);
        formData.append('deskId', deskId);
        formData.append('seatId', seatId);
        
        // ดึงค่าชื่อจริง (name) เพื่อนำไปใช้ใน Apps Script และ alert
        const submittedName = document.getElementById('name').value;
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
